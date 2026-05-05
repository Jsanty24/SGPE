import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usuarioService } from '../services/apiService';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import UserAvatar from '../components/UserAvatar';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import type { Usuario } from '../types';

export default function UsuariosPage() {
  const { error: toastError, success } = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<Usuario | null>(null);
  const [deleteModal, setDeleteModal] = useState<Usuario | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editRol, setEditRol] = useState('');
  const [editActivo, setEditActivo] = useState(true);
  const [editEstado, setEditEstado] = useState('ACTIVO');
  const [filtro, setFiltro] = useState('TODOS');

  const ESTADOS = [
    { id: 'ACTIVO', label: 'Activo', emoji: '🟢' },
    { id: 'AUSENTE', label: 'Ausente', emoji: '🟡' },
    { id: 'NO_MOLESTAR', label: 'No molestar', emoji: '🔴' },
    { id: 'INACTIVO', label: 'Inactivo', emoji: '⚫' },
  ];

  const fetch = useCallback(async () => {
    try {
      const { data } = await usuarioService.getAll();
      if (data.success && data.data) setUsuarios(data.data);
    } catch (err) {
      toastError('Error', 'No se pudieron cargar los usuarios');
    }
    finally { setLoading(false); }
  }, [toastError]);

  useEffect(() => { fetch(); }, [fetch]);
  
  // Auto-refresh cada 30 segundos
  useEffect(() => {
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [fetch]);

  const onEdit = async () => {
    if (!editModal) return;
    try {
      await usuarioService.update(editModal.id, { nombre: editNombre, rol: editRol as any, activo: editActivo, estado: editEstado as any });
      success('Usuario actualizado');
      setEditModal(null);
      fetch();
    } catch (err: any) {
      toastError('Error', err.response?.data?.message || 'Error al actualizar usuario');
    }
  };

  const onDelete = async () => {
    if (!deleteModal) return;
    try {
      await usuarioService.delete(deleteModal.id);
      success('Usuario eliminado');
      setDeleteModal(null);
      fetch();
    } catch (err: any) {
      toastError('Error', err.response?.data?.message || 'Error al eliminar usuario');
    }
  };

  if (loading) return <LoadingSkeleton />;

  const filtrados = filtro === 'TODOS' ? usuarios : usuarios.filter(u => u.rol === filtro);

  return (
    <div>
      <h1 className="text-2xl font-bold text-dark-text mb-2">Usuarios</h1>
      <p className="text-dark-muted text-sm mb-6">Gestiona los usuarios del sistema</p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['TODOS', 'ADMIN', 'GERENTE', 'MIEMBRO', 'CLIENTE', 'VIEWER'].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filtro === f ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'bg-dark-surface text-dark-muted border border-dark-border'
            }`}>{f}</button>
        ))}
      </div>

      <div className="glass-table-container">
        <table className="glass-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>ID</th>
              <th>Contacto</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtrados.map((u, i) => (
                <motion.tr 
                  key={u.id} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={!u.activo ? 'opacity-50' : ''}
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <UserAvatar usuario={u} size="md" />
                        <span 
                          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                          style={{ 
                            backgroundColor: { ACTIVO: '#10b981', AUSENTE: '#f59e0b', NO_MOLESTAR: '#ef4444', INACTIVO: '#6b7280' }[u.estado || 'ACTIVO'] || '#10b981',
                            borderColor: 'var(--surface-color)'
                          }}
                        />
                      </div>
                      <span className="font-semibold text-dark-text">{u.nombre}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm font-mono font-bold cursor-pointer select-all" style={{ color: 'var(--text-color)' }}
                      title={`ID: ${u.codigo || u.id.slice(0, 8)}`}
                      onClick={() => { navigator.clipboard.writeText(String(u.codigo || '')); success('Copiado', 'ID #' + (u.codigo || '') + ' copiado'); }}>
                      #{u.codigo || u.id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="text-sm text-dark-muted">{u.correo}</td>
                  <td>
                    <span className={`text-xs px-3 py-1 rounded-full border ${
                      u.rol === 'ADMIN' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      u.rol === 'GERENTE' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                      u.rol === 'MIEMBRO' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      u.rol === 'VIEWER' ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                    }`}>{u.rol}</span>
                  </td>
                  <td>
                    <span className={`text-xs flex items-center gap-1 ${
                      u.estado === 'ACTIVO' ? 'text-green-400' : 
                      u.estado === 'AUSENTE' ? 'text-yellow-400' : 
                      u.estado === 'NO_MOLESTAR' ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        u.estado === 'ACTIVO' ? 'bg-green-500' : 
                        u.estado === 'AUSENTE' ? 'bg-yellow-500' : 
                        u.estado === 'NO_MOLESTAR' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                      {u.estado === 'ACTIVO' ? 'Activo' : 
                       u.estado === 'AUSENTE' ? 'Ausente' : 
                       u.estado === 'NO_MOLESTAR' ? 'No molestar' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                       <button onClick={() => { setEditModal(u); setEditNombre(u.nombre); setEditRol(u.rol); setEditActivo(u.activo); setEditEstado(u.estado || 'ACTIVO'); }}
                         className="p-2 text-dark-muted hover:text-primary-400 hover:bg-dark-bg rounded-lg transition-colors" title="Editar">✏️</button>
                       <button onClick={() => setDeleteModal(u)} className="p-2 text-dark-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors" title="Eliminar">🗑️</button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Editar Usuario" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-muted mb-2">Nombre</label>
            <input value={editNombre} onChange={e => setEditNombre(e.target.value)} className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-dark-text focus:outline-none focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-muted mb-2">Rol</label>
            <select value={editRol} onChange={e => setEditRol(e.target.value)} className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-dark-text focus:outline-none focus:border-primary-500 transition-all">
              <option value="ADMIN">Admin</option>
              <option value="GERENTE">Gerente</option>
              <option value="MIEMBRO">Miembro</option>
              <option value="CLIENTE">Cliente</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-muted mb-2">Estado</label>
            <select value={editEstado} onChange={e => setEditEstado(e.target.value)} className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-dark-text focus:outline-none focus:border-primary-500 transition-all">
              {ESTADOS.map(e => (
                <option key={e.id} value={e.id}>{e.emoji} {e.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-dark-muted">Cuenta activa:</label>
            <button onClick={() => setEditActivo(!editActivo)}
              className={`w-12 h-6 rounded-full transition-all ${editActivo ? 'bg-success' : 'bg-dark-border'}`}>
              <div className={`w-5 h-5 rounded-full bg-white transition-all ${editActivo ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditModal(null)} className="flex-1 py-3 rounded-xl border border-dark-border text-dark-muted">Cancelar</button>
            <button onClick={onEdit} className="flex-1 py-3 rounded-xl text-white font-semibold shimmer-btn">Guardar</button>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} onConfirm={onDelete}
        title="Eliminar Usuario" message={`¿Eliminar a "${deleteModal?.nombre}"?`} />
    </div>
  );
}
