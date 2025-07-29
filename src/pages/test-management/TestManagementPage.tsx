import React, { useState } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { HierarchicalCategorySelector } from '../../components/common/HierarchicalCategorySelector';
import { TestSeriesView } from './TestSeriesView';
import { TestsView } from './TestsView';
import { QuestionsView } from './QuestionsView';
import { ExamCategory, TestSeries, Test } from '../../services/testManagement';

type ViewType = 'categories' | 'series' | 'tests' | 'questions';

interface NavigationState {
  view: ViewType;
  selectedCategory?: ExamCategory;
  selectedSeries?: TestSeries;
  selectedTest?: Test;
}

export const TestManagementPage: React.FC = () => {
  const [navigation, setNavigation] = useState<NavigationState>({
    view: 'categories'
  });

  const handleCategorySelect = (category: ExamCategory | null) => {
    if (category) {
      setNavigation({
        view: 'series',
        selectedCategory: category
      });
    } else {
      setNavigation({ view: 'categories' });
    }
  };

  const handleSeriesSelect = (series: TestSeries) => {
    setNavigation({
      ...navigation,
      view: 'tests',
      selectedSeries: series
    });
  };

  const handleTestSelect = (test: Test) => {
    setNavigation({
      ...navigation,
      view: 'questions',
      selectedTest: test
    });
  };

  const handleNavigateBack = (targetView: ViewType) => {
    switch (targetView) {
      case 'categories':
        setNavigation({ view: 'categories' });
        break;
      case 'series':
        setNavigation({
          view: 'series',
          selectedCategory: navigation.selectedCategory
        });
        break;
      case 'tests':
        setNavigation({
          view: 'tests',
          selectedCategory: navigation.selectedCategory,
          selectedSeries: navigation.selectedSeries
        });
        break;
    }
  };

  const renderBreadcrumb = () => {
    const items = [
      { label: 'Categories', view: 'categories' as ViewType, active: navigation.view === 'categories' }
    ];

    if (navigation.selectedCategory) {
      items.push({
        label: `${navigation.selectedCategory.name} Series`,
        view: 'series' as ViewType,
        active: navigation.view === 'series'
      });
    }

    if (navigation.selectedSeries) {
      items.push({
        label: `${navigation.selectedSeries.title} Tests`,
        view: 'tests' as ViewType,
        active: navigation.view === 'tests'
      });
    }

    if (navigation.selectedTest) {
      items.push({
        label: `${navigation.selectedTest.title} Questions`,
        view: 'questions' as ViewType,
        active: navigation.view === 'questions'
      });
    }

    return (
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          {items.map((item, index) => (
            <li key={item.view} className="flex items-center">
              {index > 0 && (
                <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
              )}
              <button
                onClick={() => handleNavigateBack(item.view)}
                className={`text-sm font-medium ${
                  item.active
                    ? 'text-blue-600 cursor-default'
                    : 'text-gray-500 hover:text-gray-700 cursor-pointer'
                }`}
                disabled={item.active}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ol>
      </nav>
    );
  };

  const renderContent = () => {
    switch (navigation.view) {
      case 'categories':
        return (
          <div className="max-w-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Select Category
              </h2>
              <p className="text-gray-600">
                Choose a category to manage its test series, tests, and questions.
              </p>
            </div>
            <HierarchicalCategorySelector
              onCategorySelect={handleCategorySelect}
              placeholder="Select a category to continue"
              required
            />
          </div>
        );

      case 'series':
        return navigation.selectedCategory ? (
          <TestSeriesView
            category={navigation.selectedCategory}
            onSeriesSelect={handleSeriesSelect}
          />
        ) : null;

      case 'tests':
        return navigation.selectedSeries ? (
          <TestsView
            series={navigation.selectedSeries}
            onTestSelect={handleTestSelect}
          />
        ) : null;

      case 'questions':
        return navigation.selectedTest ? (
          <QuestionsView
            test={navigation.selectedTest}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Test Management</h1>
        <p className="text-gray-600 mt-1">
          Manage your test categories, series, individual tests, and questions in a hierarchical structure.
        </p>
      </div>

      {/* Breadcrumb Navigation */}
      {navigation.view !== 'categories' && renderBreadcrumb()}

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default TestManagementPage;