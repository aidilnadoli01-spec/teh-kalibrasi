const fs = require('fs');
let content = fs.readFileSync('src/app/admin/page.tsx', 'utf-8');

// 1. Add confirmDialog state
if (!content.includes('confirmDialog')) {
  content = content.replace(
    '  const [toast, setToast] = useState<{message: string, type: \'success\'|\'error\'} | null>(null);',
    `  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({isOpen: false, title: '', message: '', onConfirm: () => {}});
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);`
  );
}

// 2. Wrap deleteOrder
if (content.includes("if (!confirm('Delete this order?')) return;")) {
  content = content.replace(
    /const deleteOrder = async \(orderId: number\) => {[\s\S]*?if \(!confirm\('Delete this order\?'\)\) return;/m,
    `const deleteOrder = (orderId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Order',
      message: 'Are you sure you want to delete this order? This action cannot be undone.',
      onConfirm: async () => {
        setLoading(true);`
  );
  // We need to close the setConfirmDialog block properly at the end of the original deleteOrder block
  // This is tricky using regex. Alternatively, I can just replace the confirm lines.
}

