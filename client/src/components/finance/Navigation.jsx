import React, { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,    
  Avatar,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Receipt as InvoiceIcon,
  People as CustomerIcon,
  Description as BillIcon,
  Payment as PaymentIcon,
  Business as VendorIcon,
  Assessment as ReportIcon,
  Security as AuditIcon,
  AccountCircle as AccountIcon
} from '@mui/icons-material';

const Navigation = ({ user, onLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const location = useLocation();

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    onLogout();
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const navigationItems = [
    { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { text: 'Invoices', path: '/invoices', icon: <InvoiceIcon /> },
    { text: 'Bills', path: '/bills', icon: <BillIcon /> },
    { text: 'Payments', path: '/payments/new', icon: <PaymentIcon /> },
    { text: 'Vendors', path: '/vendors', icon: <VendorIcon /> },
    { text: 'Reports', path: '/reports', icon: <ReportIcon /> },
    { text: 'Audit Log', path: '/audit', icon: <AuditIcon /> }
  ];

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Finance Manager
        </Typography>
        <Box sx={{ display: 'flex' }}>
          {navigationItems.map((item) => (
            <Button
              key={item.text}
              color="inherit"
              component={RouterLink}
              to={item.path}
              startIcon={item.icon}
              sx={{
                mx: 1,
                backgroundColor: isActive(item.path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              {item.text}
            </Button>
          ))}
        </Box>
        <Box sx={{ ml: 2 }}>
          <IconButton
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              <AccountIcon />
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem disabled>
              <Typography variant="body2">
                {user?.name || user?.email}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
