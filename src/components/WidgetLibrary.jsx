import { useState } from 'react';

export default function WidgetLibrary({ onAddField, className = "", isMobile = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const widgets = [
    {
      id: 'text',
      name: 'Text Input',
      category: 'basic',
      icon: '📝',
      description: 'Single line text input',
      fieldType: 'text'
    },
    {
      id: 'textarea',
      name: 'Textarea',
      category: 'basic',
      icon: '📄',
      description: 'Multi-line text input',
      fieldType: 'textarea'
    },
    {
      id: 'email',
      name: 'Email',
      category: 'basic',
      icon: '✉️',
      description: 'Email address input',
      fieldType: 'email'
    },
    {
      id: 'number',
      name: 'Number',
      category: 'basic',
      icon: '🔢',
      description: 'Numeric input',
      fieldType: 'number'
    },
    {
      id: 'tel',
      name: 'Phone',
      category: 'basic',
      icon: '📱',
      description: 'Phone number input',
      fieldType: 'tel'
    },
    {
      id: 'url',
      name: 'Website URL',
      category: 'basic',
      icon: '🌐',
      description: 'Website URL input',
      fieldType: 'url'
    },
    {
      id: 'select',
      name: 'Dropdown',
      category: 'choice',
      icon: '📋',
      description: 'Dropdown selection',
      fieldType: 'select',
      defaultOptions: ['Option 1', 'Option 2', 'Option 3']
    },
    {
      id: 'radio',
      name: 'Radio Buttons',
      category: 'choice',
      icon: '🔘',
      description: 'Single choice from options',
      fieldType: 'radio',
      defaultOptions: ['Yes', 'No', 'Maybe']
    },
    {
      id: 'checkbox',
      name: 'Checkboxes',
      category: 'choice',
      icon: '☑️',
      description: 'Multiple choice selection',
      fieldType: 'checkbox',
      defaultOptions: ['Option A', 'Option B', 'Option C']
    },
    {
      id: 'date',
      name: 'Date Picker',
      category: 'datetime',
      icon: '📅',
      description: 'Date selection',
      fieldType: 'date'
    },
    {
      id: 'time',
      name: 'Time Picker',
      category: 'datetime',
      icon: '⏰',
      description: 'Time selection',
      fieldType: 'time'
    },
    {
      id: 'datetime-local',
      name: 'Date & Time',
      category: 'datetime',
      icon: '📆',
      description: 'Date and time selection',
      fieldType: 'datetime-local'
    },
    {
      id: 'file',
      name: 'File Upload',
      category: 'advanced',
      icon: '📎',
      description: 'File attachment',
      fieldType: 'file'
    },
    {
      id: 'range',
      name: 'Slider',
      category: 'advanced',
      icon: '🎚️',
      description: 'Range slider input',
      fieldType: 'range'
    },
    {
      id: 'color',
      name: 'Color Picker',
      category: 'advanced',
      icon: '🎨',
      description: 'Color selection',
      fieldType: 'color'
    },
    {
      id: 'rating',
      name: 'Star Rating',
      category: 'feedback',
      icon: '⭐',
      description: 'Star rating widget',
      fieldType: 'range',
      customAttributes: { min: 1, max: 5, step: 1 }
    },
    {
      id: 'likert',
      name: 'Likert Scale',
      category: 'feedback',
      icon: '📊',
      description: 'Agreement scale',
      fieldType: 'radio',
      defaultOptions: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
    },
    {
      id: 'nps',
      name: 'NPS Score',
      category: 'feedback',
      icon: '📈',
      description: 'Net Promoter Score (0-10)',
      fieldType: 'range',
      customAttributes: { min: 0, max: 10, step: 1 }
    }
  ];

  const categories = [
    { id: 'all', name: 'All Widgets', count: widgets.length },
    { id: 'basic', name: 'Basic Fields', count: widgets.filter(w => w.category === 'basic').length },
    { id: 'choice', name: 'Choice Fields', count: widgets.filter(w => w.category === 'choice').length },
    { id: 'datetime', name: 'Date & Time', count: widgets.filter(w => w.category === 'datetime').length },
    { id: 'advanced', name: 'Advanced', count: widgets.filter(w => w.category === 'advanced').length },
    { id: 'feedback', name: 'Feedback', count: widgets.filter(w => w.category === 'feedback').length }
  ];

  const filteredWidgets = widgets.filter(widget => {
    // Improved search matching - trim and handle empty search
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch = !searchLower || 
                         widget.name.toLowerCase().includes(searchLower) ||
                         widget.description.toLowerCase().includes(searchLower) ||
                         widget.category.toLowerCase().includes(searchLower);
    
    const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
    
    // Debug logging (remove this in production)
    if (searchTerm || selectedCategory !== 'all') {
      console.log(`Widget: ${widget.name}, Category: ${widget.category}, SearchTerm: "${searchTerm}", SelectedCategory: "${selectedCategory}", MatchesSearch: ${matchesSearch}, MatchesCategory: ${matchesCategory}`);
    }
    
    return matchesSearch && matchesCategory;
  });
  
  // Debug the final filtered results
  if (searchTerm || selectedCategory !== 'all') {
    console.log(`Total widgets: ${widgets.length}, Filtered widgets: ${filteredWidgets.length}`, filteredWidgets.map(w => w.name));
  }

  // Handle drag start for widgets
  const handleDragStart = (e, widget) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'widget',
      widget: widget
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleAddWidget = (widget) => {
    const newField = {
      label: widget.name,
      field_type: widget.fieldType,
      is_required: false,
      is_readonly: false,
      options: widget.defaultOptions ? JSON.stringify(widget.defaultOptions) : '',
      accept: widget.fieldType === 'file' ? '*/*' : '',
      maxSize: widget.fieldType === 'file' ? '10MB' : '',
      allowMultiple: widget.fieldType === 'file' ? false : undefined,
      display_order: 0,
      ...widget.customAttributes
    };
    
    onAddField(newField);
  };

  return (
    <div className={`bg-gray-800/80 backdrop-blur-xl ${className} flex ${isMobile ? 'flex-col h-auto' : 'h-full overflow-hidden max-h-full'} border border-gray-700/50 rounded-lg`}>
      {/* Desktop Sidebar */}
      {showFilters && !isMobile && (
        <div className="hidden lg:block">
          <div className="w-48 flex-shrink-0 border-r border-gray-600/50 bg-gray-900/50 flex flex-col h-full overflow-hidden">
          {/* Search */}
          <div className="flex-shrink-0 p-3 border-b border-gray-600/50">
              <div className="relative mb-3">
                <svg className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search widgets..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    // Auto-close filter panel when user starts typing
                    if (e.target.value.length > 0 && showFilters) {
                      setShowFilters(false);
                    }
                  }}
                  className="w-full pl-6 pr-8 py-2 text-xs bg-gray-700/50 border border-gray-600/50 rounded focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-transparent text-white placeholder:text-gray-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-gray-600"
                    title="Clear search"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Clear all filters button */}
              {(searchTerm || selectedCategory !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  className="w-full text-xs text-cyan-300 hover:text-white py-1 px-2 border border-cyan-500/30 rounded hover:bg-cyan-600/20 transition-all duration-300"
                >
                  Clear All Filters
                </button>
              )}
            </div>

            {/* Categories Navigation */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="flex-shrink-0 p-3 pb-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-purple-300 uppercase tracking-wide">Categories</h4>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-1 text-purple-400 hover:text-cyan-300 hover:bg-purple-800/30 rounded transition-colors"
                    title="Close filters"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div 
                className="px-3 pb-3 scrollbar-hide" 
                style={{
                  height: '200px',
                  overflowY: 'scroll',
                  overflowX: 'hidden',
                  display: 'block',
                  position: 'relative'
                }}
              >
                <div className="space-y-1" style={{ minHeight: '220px' }}>
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      // Auto-close filter panel after selection (except for "All Widgets")
                      if (category.id !== 'all') {
                        setShowFilters(false);
                      }
                    }}
                    className={`w-full text-left px-3 py-2 text-sm font-medium rounded transition-all duration-300 ${
                      selectedCategory === category.id
                        ? 'bg-gradient-to-r from-purple-600/30 to-cyan-600/30 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/20'
                        : 'text-purple-300 hover:bg-purple-800/30 border border-transparent hover:border-purple-600/30 hover:text-cyan-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{category.name}</span>
                      <span className="text-xs text-gray-400 ml-1">({category.count})</span>
                    </div>
                  </button>
                ))}
                {/* Spacing equivalent to one more category */}
                <div className="h-12"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Widget Grid */}
      <div className={`flex-1 flex flex-col ${isMobile ? 'h-auto' : 'overflow-hidden h-full max-h-full'}`}>
        {/* Header with Toggle Button */}
        <div className="flex-shrink-0 flex items-center justify-between p-2 border-b border-purple-800/30 bg-gray-900/50 backdrop-blur-sm">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-shrink-0 p-1 rounded transition-all duration-300 ${
                showFilters || selectedCategory !== 'all' || searchTerm
                  ? 'text-cyan-300 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30'
                  : 'text-purple-300 hover:text-cyan-300 hover:bg-purple-800/30 border border-transparent'
              }`}
              title={showFilters ? 'Hide Filters' : 'Show Filters'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
            </button>
            
            {!showFilters && (
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                {/* Quick Search when filters are hidden */}
                <div className="relative flex-1 max-w-40">
                  <svg className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-6 pr-6 py-1 text-xs bg-gray-900/70 border border-purple-600/50 text-white placeholder-gray-400 rounded focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-cyan-300 transition-colors"
                      title="Clear search"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {/* Category indicator */}
                {selectedCategory !== 'all' && (
                  <div className="flex items-center space-x-1">
                    <span className="flex-shrink-0 px-2 py-1 text-xs bg-gradient-to-r from-purple-600/30 to-cyan-600/30 text-cyan-300 rounded-full truncate border border-cyan-500/30">
                      {categories.find(c => c.id === selectedCategory)?.name}
                    </span>
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="w-4 h-4 text-purple-400 hover:text-cyan-300 transition-colors"
                      title="Clear category filter"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <span className="flex-shrink-0 text-xs text-purple-300 ml-2">
            {filteredWidgets.length}{filteredWidgets.length !== widgets.length ? ` of ${widgets.length}` : ''}
          </span>
        </div>
        
        {/* Filter Status Indicator - Always show when filters are active */}
        {(searchTerm || selectedCategory !== 'all') && (
          <div className="flex-shrink-0 bg-gradient-to-r from-purple-900/50 to-cyan-900/50 backdrop-blur-sm border-b border-purple-700/30 px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-cyan-300 font-medium">Active Filters:</span>
                {searchTerm && (
                  <span className="bg-purple-600/30 text-cyan-300 px-2 py-1 rounded border border-cyan-500/30">
                    Search: "{searchTerm}"
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="bg-purple-600/30 text-cyan-300 px-2 py-1 rounded border border-cyan-500/30">
                    Category: {categories.find(c => c.id === selectedCategory)?.name}
                  </span>
                )}
                <span className="text-cyan-400">({filteredWidgets.length} results)</span>
              </div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="text-xs text-cyan-300 hover:text-white underline transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>
        )}        {/* Widget List */}
        <div className={`flex-1 widget-grid min-h-0 scrollbar-hide ${isMobile ? '' : 'overflow-y-auto'}`}>
          <div className="p-2 pb-6">
            {filteredWidgets.length > 0 ? (
              <div className="space-y-2">
                {filteredWidgets.map(widget => (
                  <div
                    key={widget.id}
                    className="group border border-purple-600/30 bg-gray-800/50 backdrop-blur-sm rounded-lg p-2 hover:border-cyan-400/50 hover:bg-gray-700/60 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 cursor-pointer transform hover:scale-105"
                    onClick={() => handleAddWidget(widget)}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, widget)}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="text-base flex-shrink-0">{widget.icon}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-medium text-white group-hover:text-cyan-300 truncate transition-colors">
                          {widget.name}
                        </h4>
                        <p className="text-xs text-purple-300 group-hover:text-purple-200 truncate transition-colors">
                          {widget.description}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-purple-300">
                <svg className="mx-auto h-8 w-8 text-purple-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-sm font-medium text-white">No widgets found</p>
                {searchTerm && (
                  <p className="text-xs mb-2">No results for "{searchTerm}"</p>
                )}
                {selectedCategory !== 'all' && (
                  <p className="text-xs mb-2">in {categories.find(c => c.id === selectedCategory)?.name}</p>
                )}
                <div className="space-x-2">
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-xs text-cyan-300 hover:text-white transition-colors"
                    >
                      Clear search
                    </button>
                  )}
                  {selectedCategory !== 'all' && (
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="text-xs text-cyan-300 hover:text-white transition-colors"
                    >
                      Show all categories
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
