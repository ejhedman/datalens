import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const SqlPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
  backgroundColor: theme.palette.grey[100],
  overflow: 'auto',
  maxHeight: '200px',
}));

const SqlCode = styled('pre')(({ theme }) => ({
  margin: 0,
  fontFamily: 'monospace',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
}));

interface SqlDisplayProps {
  sql: string;
  params: any[];
}

export const SqlDisplay: React.FC<SqlDisplayProps> = ({ sql, params }) => {
  if (!sql) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Last SQL Query
      </Typography>
      <SqlPaper elevation={0}>
        <SqlCode>
          {sql}
        </SqlCode>
        {params.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Parameters:
            </Typography>
            <SqlCode>
              {JSON.stringify(params, null, 2)}
            </SqlCode>
          </Box>
        )}
      </SqlPaper>
    </Box>
  );
}; 