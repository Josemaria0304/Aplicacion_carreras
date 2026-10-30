import { AlertTriangle, Trash2 } from 'lucide-react'
import { Button, Modal } from '@/components/ui'

interface ConfirmDeleteModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  itemName: string
  itemType?: string
  loading?: boolean
}

export function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType = 'registro',
  loading = false,
}: ConfirmDeleteModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            <Trash2 className="h-4 w-4" />
            {loading ? 'Eliminando…' : 'Eliminar definitivamente'}
          </Button>
        </>
      }
    >
      <div className="space-y-3 py-1">
        <div className="flex items-start gap-3 rounded-xl border border-red/20 bg-red/10 p-3.5">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red" />
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-red">Acción irreversible</p>
            <p className="text-text/90">
              ¿Estás seguro de que deseas eliminar permanentemente {itemType}{' '}
              <span className="font-bold text-accent">{itemName}</span>?
            </p>
            <p className="text-dim">
              Esta acción borrará la información de la base de datos y de la memoria de la aplicación.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
