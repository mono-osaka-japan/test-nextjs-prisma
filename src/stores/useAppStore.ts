import { create } from 'zustand';

interface ModalState {
  isOpen: boolean;
  type: 'site' | 'config' | 'confirm' | null;
  data?: unknown;
}

interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
}

interface AppState {
  sidebar: SidebarState;
  modal: ModalState;

  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;

  // Modal actions
  openModal: (type: ModalState['type'], data?: unknown) => void;
  closeModal: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebar: {
    isCollapsed: false,
    isMobileOpen: false,
  },
  modal: {
    isOpen: false,
    type: null,
    data: undefined,
  },

  toggleSidebar: () =>
    set((state) => ({
      sidebar: {
        ...state.sidebar,
        isCollapsed: !state.sidebar.isCollapsed,
      },
    })),

  setSidebarCollapsed: (collapsed) =>
    set((state) => ({
      sidebar: {
        ...state.sidebar,
        isCollapsed: collapsed,
      },
    })),

  setMobileSidebarOpen: (open) =>
    set((state) => ({
      sidebar: {
        ...state.sidebar,
        isMobileOpen: open,
      },
    })),

  openModal: (type, data) =>
    set({
      modal: {
        isOpen: true,
        type,
        data,
      },
    }),

  closeModal: () =>
    set({
      modal: {
        isOpen: false,
        type: null,
        data: undefined,
      },
    }),
}));
