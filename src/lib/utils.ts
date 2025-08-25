export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) {
    console.debug('formatDate: date is null/undefined:', date);
    return '-';
  }
  
  try {
    const dateObj = new Date(date);
    
    // Check if date is invalid
    if (isNaN(dateObj.getTime())) {
      console.warn('formatDate: Invalid date detected:', date, 'Type:', typeof date);
      return '-';
    }
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('formatDate: Error formatting date:', date, error);
    return '-';
  }
};

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = new Date(date);
    
    // Check if date is invalid
    if (isNaN(dateObj.getTime())) {
      return '-';
    }
    
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.warn('Error formatting date time:', date, error);
    return '-';
  }
};

export const formatRelativeTime = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = new Date(date);
    
    // Check if date is invalid
    if (isNaN(dateObj.getTime())) {
      return '-';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return formatDate(date);
  } catch (error) {
    console.warn('Error formatting relative time:', date, error);
    return '-';
  }
};