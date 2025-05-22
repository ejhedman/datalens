import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Tooltip, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DataObjectIcon from '@mui/icons-material/DataObject';
import { Code } from 'lucide-react';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    minWidth: '600px',
    maxWidth: '80vw',
  },
}));

const SqlContent = styled('pre')(({ theme }) => ({
  margin: 0,
  fontFamily: 'monospace',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.grey[100],
  borderRadius: theme.shape.borderRadius,
}));

interface SqlDialogProps {
  open: boolean;
  onClose: () => void;
  sql?: string;
  params?: any[];
  showSubstituted: boolean;
  onToggleSubstituted: () => void;
}

export default function SqlDialog({ 
  open, 
  onClose, 
  sql, 
  params = [], 
  showSubstituted,
  onToggleSubstituted 
}: SqlDialogProps) {
  const handleCopySql = () => {
    if (!sql) return;
    const textToCopy = showSubstituted ? substituteParams(sql, params) : sql;
    navigator.clipboard.writeText(textToCopy);
    onClose();
  };

  const substituteParams = (query: string, params: any[]): string => {
    let result = query;
    params.forEach((param, index) => {
      const value = typeof param === 'string' ? `'${param}'` : param;
      result = result.replace(`$${index + 1}`, value);
    });
    return result;
  };

  if (!sql) return null;

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle className="flex items-center justify-between">
        <span>SQL Query</span>
        <div className="flex items-center gap-2">
          <Tooltip title="Toggle between raw SQL and substituted values">
            <IconButton
              size="small"
              onClick={onToggleSubstituted}
              color={showSubstituted ? "primary" : "default"}
            >
              {showSubstituted ? <DataObjectIcon /> : <Code />}
            </IconButton>
          </Tooltip>
        </div>
      </DialogTitle>
      <DialogContent>
        <SqlContent>
          {showSubstituted ? substituteParams(sql, params) : sql}
        </SqlContent>
        {params.length > 0 && !showSubstituted && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Parameters:
            </Typography>
            <SqlContent>
              {JSON.stringify(params, null, 2)}
            </SqlContent>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleCopySql}
          startIcon={<ContentCopyIcon />}
          variant="contained"
        >
          Copy to Clipboard
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </StyledDialog>
  );
} 