import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

// Local Database imports
import { auth, signOut, onAuthStateChanged } from './firebase/auth';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  refreshDatabase,
  getAvailableYears,
  readYearData,
  writeYearData,
  addNewYear
} from './database/db';

// Supabase imports
import { supabase, toCamelCase, toSnakeCase } from './supabase/client';

// Component imports
import Header from './components/Header';
import ProjectCard from './components/ProjectCard';
import ClientCard from './components/ClientCard';
import AddProjectModal from './components/AddProjectModal';
import AddClientModal from './components/AddClientModal';
import ConfirmationModal from './components/ConfirmationModal';
import LoginModal from './components/LoginModal';
import ProjectDetailPage from './components/ProjectDetailPage';
import ClientDetailPage from './components/ClientDetailPage';
import ClientList from './components/ClientList';
import ProjectListPage from './components/ProjectListPage';
import SelectionPage from './components/SelectionPage';
import DataManagementModal from './components/DataManagementModal';
import Dashboard from './components/Dashboard';
import UpdateNotification from './components/UpdateNotification';
import AddYearModal from './components/AddYearModal';
import CalendarView from './components/CalendarView';
import WeeklyReportView from './components/WeeklyReportView';
import FinanceSection from './components/FinanceSection';
import ChecklistSection from './components/ChecklistSection';
import ChecklistDetail from './components/DocumentChecklist';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  // === STATE ===
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedOrg, setSelectedOrg] = useState(null); // 'AI' or 'INA'
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'explorer'

  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isDataManagementModalOpen, setIsDataManagementModalOpen] = useState(false);

  // Update state
  const [updateStatus, setUpdateStatus] = useState('idle'); // 'idle' | 'checking' | 'downloading' | 'downloaded' | 'no-update' | 'error'
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [projectSortConfig, setProjectSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [currentUser, setCurrentUser] = useState(null);

  // Year-based database state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([new Date().getFullYear()]);
  const [isAddYearModalOpen, setIsAddYearModalOpen] = useState(false);

  // Comments and Notifications state
  const [comments, setComments] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Checklists state
  const [checklists, setChecklists] = useState([]);
  const [selectedChecklistId, setSelectedChecklistId] = useState(null);

  // === EFFECT 1: Auth State ===
  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (!user) {
        setSelectedOrg(null);
        setSelectedClientId(null);
        setSelectedProjectId(null);
        setActiveTab('home');
      }
    });
    return () => unsubscribe();
  }, []);

  // === EFFECT 1.5: Load Available Years ===
  useEffect(() => {
    const loadYears = async () => {
      if (isLoggedIn) {
        try {
          const years = await getAvailableYears();
          setAvailableYears(years.length > 0 ? years : [new Date().getFullYear()]);
        } catch (error) {
          console.error('Error loading years:', error);
        }
      }
    };
    loadYears();
  }, [isLoggedIn]);

  // === EFFECT 1.6: Logout on Window Close ===
  useEffect(() => {
    if (window.electron?.onWindowClose) {
      window.electron.onWindowClose(async () => {
        console.log('Window closing, logging out...');
        try {
          // Save current year data before logout
          if (clients.length > 0 || projects.length > 0) {
            await writeYearData(selectedYear, { clients, projects });
          }
          await signOut();
        } catch (error) {
          console.error('Logout on close error:', error);
        }
      });
    }
  }, [clients, projects, selectedYear]);

  // === EFFECT 2: Supabase Real-time Data Subscription ===
  useEffect(() => {
    if (!isLoggedIn) {
      setClients([]);
      setProjects([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Initial data load
    const loadInitialData = async () => {
      try {
        // Fetch clients
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });

        if (clientsError) throw clientsError;
        setClients((clientsData || []).map(c => toCamelCase(c)));

        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;
        setProjects((projectsData || []).map(p => toCamelCase(p)));

        console.log(`Supabase: Loaded ${clientsData?.length || 0} clients, ${projectsData?.length || 0} projects`);
      } catch (error) {
        console.error('Error loading Supabase data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();

    // Real-time subscription for clients
    const clientsSubscription = supabase
      .channel('clients-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        (payload) => {
          console.log('Clients change:', payload.eventType);
          if (payload.eventType === 'INSERT') {
            setClients(prev => [toCamelCase(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setClients(prev => prev.map(c =>
              c.id === payload.new.id ? toCamelCase(payload.new) : c
            ));
          } else if (payload.eventType === 'DELETE') {
            setClients(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Real-time subscription for projects
    const projectsSubscription = supabase
      .channel('projects-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          console.log('Projects change:', payload.eventType);
          if (payload.eventType === 'INSERT') {
            setProjects(prev => [toCamelCase(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setProjects(prev => prev.map(p =>
              p.id === payload.new.id ? toCamelCase(payload.new) : p
            ));
          } else if (payload.eventType === 'DELETE') {
            setProjects(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Real-time subscription for comments
    const commentsSubscription = supabase
      .channel('comments-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        (payload) => {
          console.log('Comments change:', payload.eventType);
          if (payload.eventType === 'INSERT') {
            setComments(prev => [toCamelCase(payload.new), ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setComments(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Real-time subscription for notifications
    const notificationsSubscription = supabase
      .channel('notifications-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          console.log('Notifications change:', payload.eventType);
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [toCamelCase(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => prev.map(n =>
              n.id === payload.new.id ? toCamelCase(payload.new) : n
            ));
          }
        }
      )
      .subscribe();

    // Load initial comments and notifications
    const loadCommentsAndNotifications = async () => {
      // Load comments
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });
      if (commentsData) setComments(commentsData.map(c => toCamelCase(c)));

      // Load notifications for current user
      if (currentUser?.email) {
        const { data: notifsData } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_email', currentUser.email)
          .order('created_at', { ascending: false });
        if (notifsData) setNotifications(notifsData.map(n => toCamelCase(n)));
      }

      // Load checklists
      const { data: checklistsData } = await supabase
        .from('checklists')
        .select('*')
        .order('created_at', { ascending: false });
      if (checklistsData) setChecklists(checklistsData.map(c => toCamelCase(c)));
    };
    loadCommentsAndNotifications();

    // Real-time subscription for checklists
    const checklistsSubscription = supabase
      .channel('checklists-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'checklists' },
        (payload) => {
          console.log('Checklists change:', payload.eventType);
          if (payload.eventType === 'INSERT') {
            setChecklists(prev => [toCamelCase(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setChecklists(prev => prev.map(c =>
              c.id === payload.new.id ? toCamelCase(payload.new) : c
            ));
          } else if (payload.eventType === 'DELETE') {
            setChecklists(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(clientsSubscription);
      supabase.removeChannel(projectsSubscription);
      supabase.removeChannel(commentsSubscription);
      supabase.removeChannel(notificationsSubscription);
      supabase.removeChannel(checklistsSubscription);
    };
  }, [isLoggedIn, currentUser?.email]);

  // === EFFECT 3: Auto-Update Listeners ===
  useEffect(() => {
    if (!window.electron?.updater) return;

    // Set up update event listeners
    window.electron.updater.onChecking(() => {
      console.log('Update: Checking...');
      setUpdateStatus('checking');
    });

    window.electron.updater.onAvailable((info) => {
      console.log('Update: Available', info);
      setUpdateStatus('downloading');
    });

    window.electron.updater.onNotAvailable(() => {
      console.log('Update: Not available');
      setUpdateStatus('no-update');
      // Hide notification after 3 seconds
      setTimeout(() => setUpdateStatus('idle'), 3000);
    });

    window.electron.updater.onError((err) => {
      console.error('Update: Error', err);
      setUpdateStatus('error');
      // Hide notification after 5 seconds
      setTimeout(() => setUpdateStatus('idle'), 5000);
    });

    window.electron.updater.onDownloadProgress((percent) => {
      console.log('Update: Download progress', percent);
      setDownloadProgress(Math.round(percent));
    });

    window.electron.updater.onDownloaded((info) => {
      console.log('Update: Downloaded', info);
      setUpdateStatus('downloaded');
    });

    // Cleanup listeners on unmount
    return () => {
      if (window.electron?.updater) {
        window.electron.updater.removeAllListeners();
      }
    };
  }, []);

  // Handle restart for update
  const handleRestartForUpdate = async () => {
    if (window.electron?.updater) {
      await window.electron.updater.restartAndInstall();
    }
  };

  // === HANDLERS ===

  // -- Client Handlers --
  const handleAddClient = async (clientName) => {
    if (!isLoggedIn || !selectedOrg) return;

    // Generate temporary ID for optimistic update
    const tempId = `temp-${uuidv4()}`;
    const newClient = {
      id: tempId,
      name: clientName,
      org: selectedOrg,
      createdAt: new Date().toISOString(),
      createdBy: currentUser ? {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email
      } : null
    };

    // Optimistic update - add to local state immediately
    setClients(prev => [newClient, ...prev]);

    // Sync to Supabase (no .select() needed - realtime will update with real ID)
    const { error } = await supabase
      .from('clients')
      .insert({
        name: clientName,
        org: selectedOrg,
        created_by: currentUser ? {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email
        } : null
      });

    if (error) {
      console.error('Error adding client:', error);
      // Rollback on error
      setClients(prev => prev.filter(c => c.id !== tempId));
    }
  };

  const handleSelectClient = (id) => {
    setSelectedClientId(id);
    setSelectedProjectId(null);
    setProjectSearchTerm('');
    setProjectSortConfig({ key: 'name', direction: 'asc' });
  };

  const handleUpdateClient = async (clientId, newName) => {
    if (!isLoggedIn) return;

    // Store previous value for rollback
    const previousClient = clients.find(c => c.id === clientId);

    // Optimistic update
    setClients(prev => prev.map(c =>
      c.id === clientId ? { ...c, name: newName, updatedAt: new Date().toISOString() } : c
    ));

    const { error } = await supabase
      .from('clients')
      .update({ name: newName, updated_at: new Date().toISOString() })
      .eq('id', clientId);

    if (error) {
      console.error('Error updating client:', error);
      // Rollback on error
      if (previousClient) {
        setClients(prev => prev.map(c =>
          c.id === clientId ? previousClient : c
        ));
      }
    }
  };

  const executeDeleteClient = async (id) => {
    // Store for rollback
    const deletedClient = clients.find(c => c.id === id);
    const clientIndex = clients.findIndex(c => c.id === id);

    // Optimistic delete
    setClients(prev => prev.filter(c => c.id !== id));
    if (selectedClientId === id) setSelectedClientId(null);

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting client:', error);
      // Rollback on error
      if (deletedClient) {
        setClients(prev => {
          const newClients = [...prev];
          newClients.splice(clientIndex, 0, deletedClient);
          return newClients;
        });
      }
    }
  };

  // -- Project Handlers --
  const handleAddProject = async (projectData) => {
    if (!isLoggedIn || !selectedOrg) return;

    // For INA, clientId is not required; For AI, it is required
    if (selectedOrg === 'AI' && !selectedClientId) return;

    // Get PIC from form data or auto-fill from current user
    const picName = projectData.pic || currentUser?.name || currentUser?.email?.split('@')[0] || '';

    // Generate temporary ID for optimistic update
    const tempId = `temp-${uuidv4()}`;
    const newProject = {
      id: tempId,
      name: projectData.name || projectData,
      location: projectData.location || "",
      quotationNumber: projectData.quotationNumber || "",
      quotationPrice: projectData.quotationPrice || 0,
      dueDate: projectData.dueDate || null,
      pic: picName,
      tenderStatus: projectData.tenderStatus || "In progress",
      milestones: [],
      org: selectedOrg,
      clientId: selectedOrg === 'INA' ? null : selectedClientId,
      createdAt: new Date().toISOString(),
      createdBy: currentUser ? {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email
      } : null
    };

    // Optimistic update
    setProjects(prev => [newProject, ...prev]);
    setSelectedProjectId(tempId);

    // Sync to Supabase (removed .select() - realtime will update with real ID)
    const { error } = await supabase
      .from('projects')
      .insert({
        name: projectData.name || projectData,
        location: projectData.location || "",
        quotation_number: projectData.quotationNumber || "",
        quotation_price: projectData.quotationPrice || 0,
        due_date: projectData.dueDate || null,
        pic: picName,
        tender_status: projectData.tenderStatus || "In progress",
        milestones: [],
        org: selectedOrg,
        client_id: selectedOrg === 'INA' ? null : selectedClientId,
        created_by: currentUser ? {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email
        } : null
      });

    if (error) {
      console.error('Error adding project:', error);
      // Rollback on error
      setProjects(prev => prev.filter(p => p.id !== tempId));
      setSelectedProjectId(null);
    }
  };

  const handleUpdateProject = async (projectId, newName) => {
    if (!isLoggedIn) return;

    // Store previous value for rollback
    const previousProject = projects.find(p => p.id === projectId);

    // Optimistic update
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, name: newName, updatedAt: new Date().toISOString() } : p
    ));

    const { error } = await supabase
      .from('projects')
      .update({ name: newName, updated_at: new Date().toISOString() })
      .eq('id', projectId);

    if (error) {
      console.error('Error updating project:', error);
      // Rollback on error
      if (previousProject) {
        setProjects(prev => prev.map(p =>
          p.id === projectId ? previousProject : p
        ));
      }
    }
  };

  const handleUpdateProjectDetails = async (projectId, updates) => {
    if (!isLoggedIn) return;

    // Store previous value for rollback
    const previousProject = projects.find(p => p.id === projectId);

    // Optimistic update
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    ));

    // Convert camelCase to snake_case for Supabase
    const snakeUpdates = {};
    if (updates.quotationNumber !== undefined) snakeUpdates.quotation_number = updates.quotationNumber;
    if (updates.quotationPrice !== undefined) snakeUpdates.quotation_price = updates.quotationPrice;
    if (updates.dueDate !== undefined) snakeUpdates.due_date = updates.dueDate;
    if (updates.tenderStatus !== undefined) snakeUpdates.tender_status = updates.tenderStatus;
    if (updates.location !== undefined) snakeUpdates.location = updates.location;
    if (updates.pic !== undefined) snakeUpdates.pic = updates.pic;
    if (updates.name !== undefined) snakeUpdates.name = updates.name;
    if (updates.milestones !== undefined) snakeUpdates.milestones = updates.milestones;
    // New remarks columns for Weekly Report
    if (updates.factory !== undefined) snakeUpdates.factory = updates.factory;
    if (updates.remarks_kontraktor !== undefined) snakeUpdates.remarks_kontraktor = updates.remarks_kontraktor;
    if (updates.remarks_principle !== undefined) snakeUpdates.remarks_principle = updates.remarks_principle;
    if (updates.remarks_ai !== undefined) snakeUpdates.remarks_ai = updates.remarks_ai;
    if (updates.insulator !== undefined) snakeUpdates.insulator = updates.insulator;
    if (updates.remarks !== undefined) snakeUpdates.remarks = updates.remarks;
    // Document Checklist (stored as JSONB)
    if (updates.checklist !== undefined) snakeUpdates.checklist = updates.checklist;
    // BAST Number and Tender Expenses (INA only, stored as JSONB)
    if (updates.bastNumber !== undefined) snakeUpdates.bast_number = updates.bastNumber;
    if (updates.tenderExpenses !== undefined) snakeUpdates.tender_expenses = updates.tenderExpenses;
    snakeUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('projects')
      .update(snakeUpdates)
      .eq('id', projectId);

    if (error) {
      console.error('Error updating project details:', error);
      // Rollback on error
      if (previousProject) {
        setProjects(prev => prev.map(p =>
          p.id === projectId ? previousProject : p
        ));
      }
    }
  };

  const handleSelectProject = (id) => {
    setSelectedProjectId(id);
  };

  const handleProjectSort = (e) => {
    const [key, direction] = e.target.value.split('-');
    setProjectSortConfig({ key, direction });
  };

  // -- Navigation --
  const handleGoHome = () => {
    setSelectedProjectId(null);
    setSelectedClientId(null);
    setActiveTab('home');
  };

  const handleBackToClientList = () => {
    setSelectedClientId(null);
    setSelectedProjectId(null);
  };

  const handleBackToProjectList = () => {
    setSelectedProjectId(null);
  };

  const handleSwitchOrg = () => {
    setSelectedOrg(null);
    setSelectedClientId(null);
    setSelectedProjectId(null);
    setActiveTab('home');
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsLoggedIn(false);
    setSelectedOrg(null);
    setSelectedClientId(null);
    setSelectedProjectId(null);
    setActiveTab('home');
  };

  const handleLogin = async (email, password) => {
    // This is passed to LoginModal, which calls db.signIn
    // But we also need to handle the state update if successful
    // The onAuthStateChanged listener will handle the state update
  };

  const handleRefresh = async () => {
    console.log("Refreshing database from OneDrive...");
    setIsLoading(true);
    await refreshDatabase();
    // The onSnapshot listeners will automatically pick up the new data
    setTimeout(() => setIsLoading(false), 500);
  };

  // Handle year change - save current year then load new year
  const handleYearChange = async (newYear) => {
    if (newYear === selectedYear) return;

    setIsLoading(true);
    try {
      // 1. Save current year data
      if (clients.length > 0 || projects.length > 0) {
        await writeYearData(selectedYear, { clients, projects });
        console.log(`Saved data for year ${selectedYear}`);
      }

      // 2. Load new year data
      const yearData = await readYearData(newYear);
      if (yearData) {
        setClients(yearData.clients || []);
        setProjects(yearData.projects || []);
        console.log(`Loaded data for year ${newYear}`);
      } else {
        // No data for this year, start fresh
        setClients([]);
        setProjects([]);
        console.log(`No data found for year ${newYear}, starting fresh`);
      }

      setSelectedYear(newYear);
    } catch (error) {
      console.error('Error switching year:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding a new year with imported JSON data
  const handleAddYear = async (year, data) => {
    try {
      // Auto-assign createdBy to projects that don't have it (importer becomes owner)
      const projectsWithOwnership = (data.projects || []).map(project => {
        if (!project.createdBy && currentUser) {
          return {
            ...project,
            createdBy: {
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email
            }
          };
        }
        return project;
      });

      const dataWithOwnership = {
        clients: data.clients || [],
        projects: projectsWithOwnership
      };

      const updatedYears = await addNewYear(year, dataWithOwnership);
      setAvailableYears(updatedYears);

      // Switch to the new year
      setClients(dataWithOwnership.clients);
      setProjects(dataWithOwnership.projects);
      setSelectedYear(year);

      console.log(`Added and switched to year ${year} (assigned ownership to ${projectsWithOwnership.length} projects)`);
    } catch (error) {
      console.error('Error adding year:', error);
      throw error;
    }
  };

  const handleGlobalSearchSelect = (type, item) => {
    if (item.org && item.org !== selectedOrg) {
      setSelectedOrg(item.org);
    }

    if (type === 'client') {
      setSelectedClientId(item.id);
      setSelectedProjectId(null);
    } else if (type === 'project') {
      setSelectedClientId(item.clientId);
      setSelectedProjectId(item.id);
    }

    setActiveTab('explorer');
  };

  // -- Comment Handlers --
  const handleAddComment = async (projectId, content, parentId = null) => {
    if (!isLoggedIn || !currentUser) return;

    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    // Generate temporary ID for optimistic update
    const tempId = `temp-${uuidv4()}`;
    const newComment = {
      id: tempId,
      projectId: projectId,
      userId: currentUser.id || currentUser.uid,
      userName: currentUser.name || currentUser.displayName || currentUser.email?.split('@')[0],
      userEmail: currentUser.email,
      content: content,
      parentId: parentId,
      createdAt: new Date().toISOString()
    };

    // Optimistic update
    setComments(prev => [newComment, ...prev]);

    // Insert to Supabase (removed .select())
    const commentInsert = {
      project_id: projectId,
      user_id: currentUser.id || currentUser.uid,
      user_name: currentUser.name || currentUser.displayName || currentUser.email?.split('@')[0],
      user_email: currentUser.email,
      content: content
    };
    if (parentId) commentInsert.parent_id = parentId;

    const { data: commentData, error: commentError } = await supabase
      .from('comments')
      .insert(commentInsert)
      .select('id')
      .single();

    if (commentError) {
      console.error('Error adding comment:', commentError);
      // Rollback on error
      setComments(prev => prev.filter(c => c.id !== tempId));
      return;
    }

    // Create notification for PIC (if PIC is not the commenter)
    const picEmail = project.createdBy?.email;
    if (picEmail && picEmail !== currentUser.email && commentData) {
      await supabase
        .from('notifications')
        .insert({
          user_email: picEmail,
          project_id: projectId,
          project_name: project.name,
          comment_id: commentData.id,
          commenter_name: currentUser.name || currentUser.displayName || currentUser.email?.split('@')[0],
          content_preview: content.substring(0, 50) + (content.length > 50 ? '...' : '')
        });
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!isLoggedIn) return;

    // Store for rollback
    const deletedComment = comments.find(c => c.id === commentId);
    const commentIndex = comments.findIndex(c => c.id === commentId);

    // Optimistic delete
    setComments(prev => prev.filter(c => c.id !== commentId));

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      // Rollback on error
      if (deletedComment) {
        setComments(prev => {
          const newComments = [...prev];
          newComments.splice(commentIndex, 0, deletedComment);
          return newComments;
        });
      }
    }
  };

  // -- Notification Handlers --
  const handleMarkNotificationAsRead = async (notificationId) => {
    // Optimistic update
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    ));

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      // Rollback on error
      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, isRead: false } : n
      ));
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (!currentUser?.email) return;

    // Optimistic update
    const previousNotifications = [...notifications];
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_email', currentUser.email)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      // Rollback on error
      setNotifications(previousNotifications);
    }
  };

  // -- Checklist Handlers --
  const handleAddChecklist = async (data) => {
    if (!isLoggedIn || !currentUser) return;

    // Generate temporary ID for optimistic update
    const tempId = `temp-${uuidv4()}`;
    const newChecklist = {
      id: tempId,
      org: selectedOrg,
      name: data.name,
      description: data.description || '',
      items: [],
      approvers: [],
      createdBy: { email: currentUser.email, name: currentUser.name || currentUser.displayName },
      createdAt: new Date().toISOString()
    };

    // Optimistic update
    setChecklists(prev => [newChecklist, ...prev]);

    const { error } = await supabase
      .from('checklists')
      .insert({
        org: selectedOrg,
        name: data.name,
        description: data.description || '',
        items: [],
        approvers: [],
        created_by: { email: currentUser.email, name: currentUser.name || currentUser.displayName }
      });

    if (error) {
      console.error('Error creating checklist:', error);
      // Rollback on error
      setChecklists(prev => prev.filter(c => c.id !== tempId));
    }
  };

  const handleUpdateChecklist = async (checklistId, updates) => {
    if (!isLoggedIn) return;

    // Store previous value for rollback
    const previousChecklist = checklists.find(c => c.id === checklistId);

    // Optimistic update
    setChecklists(prev => prev.map(c =>
      c.id === checklistId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
    ));

    const { error } = await supabase
      .from('checklists')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', checklistId);

    if (error) {
      console.error('Error updating checklist:', error);
      // Rollback on error
      if (previousChecklist) {
        setChecklists(prev => prev.map(c =>
          c.id === checklistId ? previousChecklist : c
        ));
      }
    }
  };

  const handleDeleteChecklist = async (checklistId) => {
    if (!isLoggedIn) return;

    // Store for rollback
    const deletedChecklist = checklists.find(c => c.id === checklistId);
    const checklistIndex = checklists.findIndex(c => c.id === checklistId);

    // Optimistic delete
    setChecklists(prev => prev.filter(c => c.id !== checklistId));
    if (selectedChecklistId === checklistId) setSelectedChecklistId(null);

    const { error } = await supabase
      .from('checklists')
      .delete()
      .eq('id', checklistId);

    if (error) {
      console.error('Error deleting checklist:', error);
      // Rollback on error
      if (deletedChecklist) {
        setChecklists(prev => {
          const newChecklists = [...prev];
          newChecklists.splice(checklistIndex, 0, deletedChecklist);
          return newChecklists;
        });
      }
    }
  };

  const handleSelectChecklist = (checklistId) => {
    setSelectedChecklistId(checklistId);
  };

  const handleNavigateToProject = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      if (project.org) setSelectedOrg(project.org);
      if (project.clientId) setSelectedClientId(project.clientId);
      setSelectedProjectId(projectId);
      setActiveTab('explorer');
    }
  };

  // -- Milestone Handlers --
  // Helper to update project milestones in Supabase
  const updateProjectMilestones = async (projectId, updatedMilestones) => {
    const { error } = await supabase
      .from('projects')
      .update({ milestones: updatedMilestones, updated_at: new Date().toISOString() })
      .eq('id', projectId);

    if (error) console.error('Error updating milestones:', error);
  };

  const handleAddMilestone = async (projectId, milestoneName) => {
    if (!isLoggedIn) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const newMilestone = {
      id: uuidv4(),
      name: milestoneName,
      completed: false,
      subMilestones: [],
      status: "To Do",
      priority: "Normal",
      description: "",
      tags: [],
      startDate: null,
      dueDate: null,
      createdAt: new Date().toISOString()
    };

    const updatedMilestones = [...(project.milestones || []), newMilestone];
    await updateProjectMilestones(projectId, updatedMilestones);
  };

  const handleToggleMilestone = async (projectId, milestoneId) => {
    if (!isLoggedIn) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedMilestones = (project.milestones || []).map(m => {
      if (m.id === milestoneId) {
        const newCompleted = !m.completed;
        return { ...m, completed: newCompleted, status: newCompleted ? "Done" : "In Progress" };
      }
      return m;
    });

    await updateProjectMilestones(projectId, updatedMilestones);
  };

  const handleUpdateMilestone = async (projectId, milestoneId, updates) => {
    if (!isLoggedIn) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedMilestones = (project.milestones || []).map(m => {
      if (m.id === milestoneId) {
        if (typeof updates === 'string') {
          return { ...m, name: updates };
        }
        return { ...m, ...updates };
      }
      return m;
    });

    await updateProjectMilestones(projectId, updatedMilestones);
  };

  // -- Sub-Milestone Handlers --
  const handleAddSubMilestone = async (projectId, milestoneId, subMilestoneName) => {
    if (!isLoggedIn) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const newSubMilestone = { id: uuidv4(), name: subMilestoneName, completed: false };
    const updatedMilestones = (project.milestones || []).map(m => {
      if (m.id === milestoneId) {
        return { ...m, subMilestones: [...(m.subMilestones || []), newSubMilestone] };
      }
      return m;
    });

    await updateProjectMilestones(projectId, updatedMilestones);
  };

  const handleToggleSubMilestone = async (projectId, milestoneId, subMilestoneId) => {
    if (!isLoggedIn) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedMilestones = (project.milestones || []).map(m => {
      if (m.id === milestoneId) {
        const updatedSubs = (m.subMilestones || []).map(sub =>
          sub.id === subMilestoneId ? { ...sub, completed: !sub.completed } : sub
        );
        return { ...m, subMilestones: updatedSubs };
      }
      return m;
    });

    await updateProjectMilestones(projectId, updatedMilestones);
  };

  const handleUpdateSubMilestone = async (projectId, milestoneId, subMilestoneId, newName) => {
    if (!isLoggedIn) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedMilestones = (project.milestones || []).map(m => {
      if (m.id === milestoneId) {
        const updatedSubs = (m.subMilestones || []).map(sub =>
          sub.id === subMilestoneId ? { ...sub, name: newName } : sub
        );
        return { ...m, subMilestones: updatedSubs };
      }
      return m;
    });

    await updateProjectMilestones(projectId, updatedMilestones);
  };

  // -- Delete Handlers --
  const handleAskDelete = (type, payload) => {
    if (!isLoggedIn) return;
    setDeleteTarget({ type, payload });
  };

  const handleCloseDeleteModal = () => {
    setDeleteTarget(null);
  };

  const executeDeleteProject = async (id) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) console.error('Error deleting project:', error);
    if (selectedProjectId === id) {
      setSelectedProjectId(null);
    }
  };

  const executeDeleteMilestone = async ({ projectId, milestoneId }) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedMilestones = (project.milestones || []).filter(m => m.id !== milestoneId);
    await updateProjectMilestones(projectId, updatedMilestones);
  };

  const executeDeleteSubMilestone = async ({ projectId, milestoneId, subMilestoneId }) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedMilestones = (project.milestones || []).map(m => {
      if (m.id === milestoneId) {
        const updatedSubs = (m.subMilestones || []).filter(sub => sub.id !== subMilestoneId);
        return { ...m, subMilestones: updatedSubs };
      }
      return m;
    });

    await updateProjectMilestones(projectId, updatedMilestones);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !isLoggedIn) return;
    const { type, payload } = deleteTarget;
    try {
      if (type === 'client') {
        await executeDeleteClient(payload.id);
      } else if (type === 'project') {
        await executeDeleteProject(payload.id);
      } else if (type === 'milestone') {
        await executeDeleteMilestone(payload);
      } else if (type === 'submilestone') {
        await executeDeleteSubMilestone(payload);
      }
    } catch (error) {
      console.error("Gagal menghapus:", error);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleImportData = async (data) => {
    // Handled by DataManagementModal internally or we can refresh here if needed
    // Since we use polling/listeners, it should auto-update
  };

  const handleExportData = async () => {
    // Handled by DataManagementModal
  };

  // === RENDER ===
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl font-medium">Memuat Aplikasi...</div>
      </div>
    );
  }

  // 1. Mandatory Login
  if (!isLoggedIn) {
    return <LoginModal isOpen={true} onClose={() => { }} onLogin={handleLogin} />;
  }

  // 2. Organization Selection
  if (!selectedOrg) {
    return <SelectionPage onSelect={(org) => {
      setSelectedOrg(org);
      setActiveTab('home'); // Default to home on selection
    }} />;
  }

  // Filter Data
  const filteredClients = clients.filter(c =>
    c.org === selectedOrg &&
    c.name.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  const filteredProjects = projects
    .filter(p => p.clientId === selectedClientId)
    .filter(p => p.name.toLowerCase().includes(projectSearchTerm.toLowerCase()))
    .sort((a, b) => {
      const { key, direction } = projectSortConfig;
      let comparison = 0;
      if (key === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (key === 'dueDate') {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        comparison = dateA - dateB;
      }
      return direction === 'asc' ? comparison : -comparison;
    });

  const currentProject = projects.find(p => p.id === selectedProjectId);
  const currentClient = clients.find(c => c.id === selectedClientId);

  const pageVariants = {
    initial: { opacity: 0, y: 15 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -15 },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 transition-colors">
      {isLoggedIn ? (
        <>
          <Header
            isLoggedIn={isLoggedIn}
            onLogout={handleLogout}
            onGoHome={handleGoHome}
            onShowLogin={() => setIsLoginModalOpen(true)}
            onOpenDataManagement={() => setIsDataManagementModalOpen(true)}
            clients={clients}
            projects={projects}
            onSearchResultSelect={handleGlobalSearchSelect}
            onSwitchOrg={handleSwitchOrg}
            selectedOrg={selectedOrg}
            onRefresh={handleRefresh}
            selectedYear={selectedYear}
            availableYears={availableYears}
            onYearChange={handleYearChange}
            onAddYear={() => setIsAddYearModalOpen(true)}
            notifications={notifications}
            onMarkNotificationAsRead={handleMarkNotificationAsRead}
            onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
            onNavigateToProject={handleNavigateToProject}
          />

          <main className="pt-14 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Organization Selection */}
            {!selectedOrg ? (
              <SelectionPage
                onSelectOrg={setSelectedOrg}
                currentUser={currentUser}
              />
            ) : (
              <>
                {/* Breadcrumbs / Navigation */}
                <div className="py-4 flex items-center gap-2 text-sm text-gray-500 overflow-x-auto whitespace-nowrap scrollbar-hide">
                  <button
                    onClick={handleGoHome}
                    className="hover:text-blue-600 flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Home
                  </button>
                  <span>/</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{selectedOrg === 'AI' ? 'Alam Insektindo' : 'INA Organization'}</span>

                  {selectedClientId && (
                    <>
                      <span>/</span>
                      <button
                        onClick={handleBackToClientList}
                        className="hover:text-blue-600 truncate max-w-[150px]"
                      >
                        {clients.find(c => c.id === selectedClientId)?.name || 'Client'}
                      </button>
                    </>
                  )}

                  {selectedProjectId && (
                    <>
                      <span>/</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[150px]">
                        {projects.find(p => p.id === selectedProjectId)?.name || 'Project'}
                      </span>
                    </>
                  )}
                </div>

                {/* Main Content Area */}
                <AnimatePresence mode="wait">
                  {/* CASE 1: Detail Project View */}
                  {selectedProjectId ? (
                    <motion.div
                      key="project-detail"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ProjectDetailPage
                        project={projects.find(p => p.id === selectedProjectId)}
                        onGoHome={handleBackToProjectList}
                        onBackToClients={handleBackToClientList}
                        onAddMilestone={handleAddMilestone}
                        onToggleMilestone={handleToggleMilestone}
                        onUpdateMilestone={handleUpdateMilestone}
                        onDeleteMilestone={handleAskDelete}
                        onAddSubMilestone={handleAddSubMilestone}
                        onToggleSubMilestone={handleToggleSubMilestone}
                        onUpdateSubMilestone={handleUpdateSubMilestone}
                        onDeleteSubMilestone={handleAskDelete}
                        onUpdateProject={handleUpdateProject}
                        onUpdateProjectDetails={handleUpdateProjectDetails}
                        isLoggedIn={isLoggedIn}
                        currentUser={currentUser}
                        comments={comments}
                        onAddComment={handleAddComment}
                        onDeleteComment={handleDeleteComment}
                      />
                    </motion.div>
                  ) : selectedClientId ? (
                    /* CASE 2: Client Detail View (Project List for Client) */
                    <motion.div
                      key="client-detail"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ClientDetailPage
                        client={clients.find(c => c.id === selectedClientId)}
                        projects={projects.filter(p => p.clientId === selectedClientId)}
                        onBack={handleBackToClientList}
                        onSelectProject={handleSelectProject}
                        onAddProject={() => setIsAddProjectModalOpen(true)}
                        onUpdateClient={handleUpdateClient}
                        onDeleteClient={executeDeleteClient} // Pass the delete handler
                        searchTerm={projectSearchTerm}
                        onSearchChange={setProjectSearchTerm}
                        sortConfig={projectSortConfig}
                        onSortChange={handleProjectSort}
                        isLoggedIn={isLoggedIn}
                        currentUser={currentUser}
                      />
                    </motion.div>
                  ) : (
                    /* CASE 3: Dashboard / Explorer */
                    <motion.div
                      key="dashboard"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div className="flex bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 w-fit mb-6">
                        <button
                          onClick={() => setActiveTab('home')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'home'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                          Dashboard
                        </button>
                        <button
                          onClick={() => setActiveTab('explorer')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'explorer'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                          Explorer
                        </button>
                        <button
                          onClick={() => setActiveTab('calendar')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'calendar'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                          Calendar
                        </button>
                        <button
                          onClick={() => setActiveTab('report')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'report'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                          Weekly Report
                        </button>
                        <button
                          onClick={() => setActiveTab('finance')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'finance'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                          Finance
                        </button>
                        <button
                          onClick={() => setActiveTab('checklist')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'checklist'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                          Verify Doc
                        </button>
                      </div>

                      {activeTab === 'home' && (
                        <Dashboard
                          projects={projects.filter(p => p.org === selectedOrg)}
                          clients={clients.filter(c => c.org === selectedOrg)}
                          year={selectedYear}
                          onNavigateToProject={(project) => handleGlobalSearchSelect('project', project)}
                          selectedOrg={selectedOrg}
                          onSwitchOrg={handleSwitchOrg}
                          currentUser={currentUser}
                        />
                      )}

                      {activeTab === 'explorer' && (
                        /* Explorer View: Client List -> Project List */
                        <ClientList
                          clients={filteredClients}
                          onSelectClient={handleSelectClient}
                          onAddClient={() => setIsAddClientModalOpen(true)}
                          searchTerm={clientSearchTerm}
                          onSearchChange={setClientSearchTerm}
                          isLoggedIn={isLoggedIn}
                          onAskDelete={handleAskDelete}
                          onUpdateClient={handleUpdateClient}
                        />
                      )}

                      {activeTab === 'calendar' && (
                        <CalendarView
                          projects={projects.filter(p => p.org === selectedOrg)}
                          onNavigateToProject={handleNavigateToProject}
                        />
                      )}

                      {activeTab === 'report' && (
                        <WeeklyReportView
                          projects={projects.filter(p => p.org === selectedOrg)}
                          clients={clients.filter(c => c.org === selectedOrg)}
                          onUpdateProjectDetails={handleUpdateProjectDetails}
                          currentUser={currentUser}
                        />
                      )}

                      {activeTab === 'finance' && (
                        <FinanceSection
                          currentUser={currentUser}
                        />
                      )}

                      {activeTab === 'checklist' && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 min-h-[600px]">
                          {selectedChecklistId ? (
                            <ChecklistDetail
                              checklist={checklists.find(c => c.id === selectedChecklistId)}
                              onUpdate={handleUpdateChecklist}
                              onDelete={handleDeleteChecklist}
                              onBack={() => setSelectedChecklistId(null)}
                              isLoggedIn={isLoggedIn}
                            />
                          ) : (
                            <ChecklistSection
                              checklists={checklists.filter(c => c.org === selectedOrg || !c.org)}
                              onAddChecklist={handleAddChecklist}
                              onUpdateChecklist={handleUpdateChecklist}
                              onDeleteChecklist={handleDeleteChecklist}
                              onSelectChecklist={handleSelectChecklist}
                              selectedChecklistId={selectedChecklistId}
                              currentUser={currentUser}
                              isLoggedIn={isLoggedIn}
                            />
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </main>
        </>
      ) : (
        /* Login View */
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <img
                className="h-20 w-20 rounded-2xl mx-auto shadow-xl mb-4"
                src="https://pbs.twimg.com/profile_images/1541353928071163905/DJxZXbFp_400x400.jpg"
                alt="Logo"
              />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h1>
              <p className="text-gray-500 dark:text-gray-400">Sign in to access your projects</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In with Email
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {isAddProjectModalOpen && (
          <AddProjectModal
            isOpen={isAddProjectModalOpen}
            onClose={() => setIsAddProjectModalOpen(false)}
            onAddProject={handleAddProject}
            clients={clients.filter(c => c.org === selectedOrg)}
            selectedClientId={selectedClientId}
            currentUser={currentUser}
          />
        )}
        {isAddClientModalOpen && (
          <AddClientModal
            isOpen={isAddClientModalOpen}
            onClose={() => setIsAddClientModalOpen(false)}
            onAddClient={handleAddClient}
          />
        )}
        {isDataManagementModalOpen && (
          <DataManagementModal
            isOpen={isDataManagementModalOpen}
            onClose={() => setIsDataManagementModalOpen(false)}
          />
        )}
        {isLoginModalOpen && (
          <LoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
          />
        )}
        {/* Add Year Modal */}
        {isAddYearModalOpen && (
          <AddYearModal
            isOpen={isAddYearModalOpen}
            onClose={() => setIsAddYearModalOpen(false)}
            onAddYear={handleAddYear}
            existingYears={availableYears}
          />
        )}
        <ConfirmationModal
          isOpen={!!deleteTarget}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          title={
            deleteTarget?.type === 'client' ? "Hapus Client?" :
              deleteTarget?.type === 'project' ? "Hapus Proyek?" :
                deleteTarget?.type === 'milestone' ? "Hapus Milestone?" : "Hapus Sub-Milestone?"
          }
          message={`Apakah Anda yakin ingin menghapus "${deleteTarget?.payload.name}"? Aksi ini tidak bisa dibatalkan.`}
        />
      </AnimatePresence>

      {/* Watermark */}
      <a
        href="https://github.com/jefanko"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 left-4 bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-sm z-10 transition-all duration-300 hover:bg-white/90 hover:shadow-md hover:scale-105 cursor-pointer group"
      >
        <p className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">
          made by <span className="font-medium text-gray-700 group-hover:text-blue-600">慎吾</span>
        </p>
      </a>

      {/* Update Notification */}
      <UpdateNotification
        updateStatus={updateStatus}
        downloadProgress={downloadProgress}
        onRestart={handleRestartForUpdate}
        onClose={() => setUpdateStatus('idle')}
      />
    </div>
  );
}