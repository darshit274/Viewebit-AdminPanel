/**
 * Example Usage for Fixed Bulk Operations
 * 
 * This file demonstrates the correct way to use bulk operations 
 * with the new entity-specific parameter interfaces.
 */

import { testManagementService } from './test-management.service';
import { BulkOperationHelpers } from '../types/test-management';

/**
 * CORRECT USAGE EXAMPLES
 */

// ✅ Method 1: Use the helper functions
export const bulkOperationExamples = {
  
  // Test Series bulk operations
  async bulkDeleteTestSeries(selectedUuids: string[]) {
    const params = BulkOperationHelpers.forTestSeries('delete', selectedUuids);
    return testManagementService.testSeries.bulkOperations(params);
  },

  // Categories bulk operations  
  async bulkActivateCategories(selectedUuids: string[]) {
    const params = BulkOperationHelpers.forCategories('activate', selectedUuids);
    return testManagementService.categories.bulkOperations(params);
  },

  // Sub-categories bulk operations
  async bulkDeactivateSubCategories(selectedUuids: string[]) {
    const params = BulkOperationHelpers.forSubCategories('deactivate', selectedUuids);
    return testManagementService.subCategories.bulkOperations(params);
  },

  // Tests bulk operations
  async bulkDeleteTests(selectedUuids: string[]) {
    const params = BulkOperationHelpers.forTests('delete', selectedUuids);
    return testManagementService.tests.bulkOperations(params);
  },

  // Questions bulk operations
  async bulkActivateQuestions(selectedUuids: string[]) {
    const params = BulkOperationHelpers.forQuestions('activate', selectedUuids);
    return testManagementService.questions.bulkOperations(params);
  },
};

// ✅ Method 2: Use entity-specific interfaces directly
export const directBulkOperations = {
  
  async bulkDeleteCategories(selectedUuids: string[]) {
    return testManagementService.categories.bulkOperations({
      action: 'delete',
      categoryIds: selectedUuids  // ✅ Correct field name
    });
  },

  async bulkActivateTests(selectedUuids: string[]) {
    return testManagementService.tests.bulkOperations({
      action: 'activate', 
      testIds: selectedUuids  // ✅ Correct field name
    });
  },

  async bulkDeactivateQuestions(selectedUuids: string[]) {
    return testManagementService.questions.bulkOperations({
      action: 'deactivate',
      questionIds: selectedUuids  // ✅ Correct field name  
    });
  },
};

/**
 * INCORRECT USAGE (DEPRECATED - DON'T USE)
 */

// ❌ This was the old way that caused the 400 error
export const deprecatedUsage = {
  async wrongBulkOperation(selectedUuids: string[]) {
    // ❌ This sends { action: 'delete', uuids: [...] }
    // But backend expects { action: 'delete', categoryIds: [...] }
    return testManagementService.categories.bulkOperations({
      action: 'delete',
      uuids: selectedUuids  // ❌ Wrong field name
    } as any);
  }
};

/**
 * USAGE IN COMPONENTS
 */

export const componentUsageExample = `
// In your component's bulk action handler:

const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
  if (selectedCount === 0) {
    toast.error('Please select at least one item');
    return;
  }

  try {
    // ✅ For categories - use the helper
    const params = BulkOperationHelpers.forCategories(action, selectedIds);
    await testManagementService.categories.bulkOperations(params);
    
    // OR use direct interface:
    // await testManagementService.categories.bulkOperations({
    //   action,
    //   categoryIds: selectedIds
    // });
    
    toast.success(\`\${selectedCount} categories \${action}d successfully\`);
    clearSelection();
    closeConfirmModal();
  } catch (error) {
    toast.error('Bulk operation failed');
  }
};
`;

/**
 * TYPE SAFETY BENEFITS
 */

// ✅ TypeScript will now enforce correct field names
// testManagementService.categories.bulkOperations({
//   action: 'delete',
//   categoryIds: selectedIds  // ✅ TypeScript enforces this
//   // uuids: selectedIds      // ❌ TypeScript error - property doesn't exist
// });

// ✅ Helper functions are also type-safe
// BulkOperationHelpers.forCategories('delete', selectedIds)  // ✅ Returns CategoryBulkOperationParams