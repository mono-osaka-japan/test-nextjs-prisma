import { create } from 'zustand';

// Modal data types for type safety
export interface SiteModalData {
  siteId?: string;
}

export interface ConfigModalData {
  configKey?: string;
}

export interface ConfirmModalData {
  title: string;
  message: string;
  onConfirm: () => void;
}

type ModalType = 'site' | 'config' | 'confirm';

type ModalDataMap = {
  site: SiteModalData | undefined;
  config: ConfigModalData | undefined;
  confirm: ConfirmModalData;
};

type ModalState =
  | { isOpen: false; type: null; data: undefined }
  | { isOpen: true; type: 'site'; data?: SiteModalData }
  | { isOpen: true; type: 'config'; data?: ConfigModalData }
  | { isOpen: true; type: 'confirm'; data: ConfirmModalData };

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
  openModal: <T extends ModalType>(type: T, data?: ModalDataMap[T]) => void;
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
      } as ModalState,
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
