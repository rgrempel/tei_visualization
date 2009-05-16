isc.setAutoDraw(false);

isc.defineClass("TEI");

isc.TEI.addClassProperties({
  app: null
});

isc.TEI.addProperties({
  init: function () {
    this.Super("init", arguments);

    isc.TEI.app = this;

    this.documentList = isc.DocumentList.create({
      align: "center",
      width: "100%",
      height: "100%"
    });

    this.documentWindow = isc.Window.create({
      autoCenter: true,
      title: "Document List",
      width: 400,
      height: 400,
      items: [
        this.documentList
      ]
    });

    this.panelsMenu = isc.Menu.create({
      width: 100,
      title: "Panels"
    });

    this.menuBar = isc.MenuBar.create({
      menus: [
        {
          title: "Documents",
          width: 100,
          data: [
            {
              title: "Open",
              action: function() {
                isc.TEI.app.showDocumentList();
              }
            }
          ]
        },
        {
          title: "Analysis",
          width: 100,
          data: [
            isc.NamesKWICPanel.getMenuItem(),
            isc.NamesDialogPanel.getMenuItem(),
            isc.IndexKWICPanel.getMenuItem(),
            isc.InterpsKWICPanel.getMenuItem(),
            isc.GlossaryPanel.getMenuItem(),
            isc.NotesPanel.getMenuItem(),
            isc.HeaderPanel.getMenuItem(),
            isc.DOMGridPanel.getMenuItem(),
            isc.TOCPanel.getMenuItem()
          ]
        },
        {
          title: "Counting",
          width: 100,
          data: [
            isc.InterpNamesPanel.getMenuItem(),
            isc.InterpAllNamesPanel.getMenuItem(),
            isc.InterpNamesProximity.getMenuItem(),
            isc.InterpInterpXrefPanel.getMenuItem()
          ]
        },
        {
          title: "Distribution",
          width: 100,
          data: [
            isc.DistributionNamesPanel.getMenuItem(),
            isc.DistributionInterpretationsPanel.getMenuItem(),
            isc.DistributionDialogPanel.getMenuItem(),
            isc.DistributionEverythingPanel.getMenuItem()
          ]
        },
        this.panelsMenu,
        {
          title: "Debug",
          width: 100,
          data: [
            {
              title: "Show Console",
              action: function() {
                isc.showConsole();
              }
            }
          ]
        }
      ]
    });

    this.documentArea = isc.Canvas.create({
      width: "100%",
      height: "100%"
    });

    this.navigation = isc.VLayout.create({
      width: "100%",
      height: "100%",
      members: [
        this.menuBar,
        this.documentArea
      ]
    });
  },

  showDocumentList: function() {
    this.documentWindow.show();
  },

  draw: function() {
    this.navigation.draw();
  },

  doOpenDocument: function(doc) {
    if (this.teiDocument == doc) return;
    if (this.teiDocument) {
      this.documentArea.removeChild(this.teiDocument);
      this.teiDocument.markForDestroy();
    }
    this.teiDocument = isc.TEIDocument.create({
      width: "100%",
      height: "100%",
      record: doc
    });
    if (this.teiDocument) {
      this.documentArea.addChild(this.teiDocument);
      this.teiDocument.show();
    }
  },

  newDocumentWindow: null,

  doNewDocument: function() {
    if (!this.newDocumentWindow) {
      this.newDocumentWindow = isc.NewDocumentWindow.create();
    }
    this.newDocumentWindow.show();
  }
});

isc.defineClass("TEIDocument", isc.Window).addProperties({
  record: null,
  xmlDocument: null,
  maximized: true,
  keepInParentRect: true,
  showMaximizeButton: true,
  chapterFields: null,

  setChapterFields: function(fields) {
    this.chapterFields = fields;
  },

  initWidget: function(){
    this.Super("initWidget", arguments);

    this.setTitle(this.record.title);

    this.panelList = [];

    this.dataSources = {
      tocTree: isc.TocTreeDataSource.create(),
      index: isc.IndexDataSource.create(),
      names: isc.NamesDataSource.create(),
      interpretations: isc.InterpsDataSource.create()
    };

    var self = this;
    this.dataSources.tocTree.fetchData(null, function(dsResponse, data) {
      var fields = [];

      data.map(function(chapter) {
        fields.add({name: chapter.n, type: "integer", valueXPath: "default:div[@n='" + chapter.n + "']/@count"});
      });

      self.setChapterFields(fields);
    });

    this.mainPanel = isc.XSLTFlow.create({
      xsltName: "main",
      width: "*",
      height: "100%",
      showEdges: true,
      showResizeBar: true,
      resizeBarTarget: "next"
    });

    this.rightPanel = isc.AnalysisSectionStack.create({
      teiDocument: this,
      width: 200,
      height: "100%",
      showEdges: true,
      column: "right"
    });

    this.leftPanel = isc.AnalysisSectionStack.create({
      teiDocument: this,
      width: 200,
      height: "100%",
      showEdges: true,
      column: "left",
      showResizeBar: true
    });

    if (this.record) {
      isc.XMLTools.loadXML("/documents/" + this.record.id + ".tei", {target: this, methodName: "loadXMLReply"}, {bypassCache: false});
    }

    isc.TOCPanel.create({
      teiDocument: this
    }).showInRightPanel();

    this.dock = isc.AnalysisTabSet.create({
      height: 100,
      width: "100%",
      hidden: true,
      canCloseTabs: true
    });

    this.addItem(
      isc.VLayout.create({
        members: [
          isc.HLayout.create({
            height: "*",
            showResizeBar: true,
            resizeBarTarget: "next",
            members: [
              this.leftPanel,
              this.mainPanel,
              this.rightPanel
            ]
          }),
          this.dock
        ]
      })
    );

    this.leftPanel.showIfHasSections();
    this.rightPanel.showIfHasSections();
    this.dock.showIfHasTabs();
  },

  destroy: function() {
    delete this.dataSources;
    delete this.xmlDocument;

    return this.Super("destroy", arguments);
  },

  getPanelMenuData: function() {
    return this.panelList.map(function(panel) {
      return panel.getMenuItem();
    });
  },

  closeClick: function() {
    this.markForDestroy();
  },

  registerPanel: function(panel) {
    this.panelList.add(panel);
    isc.TEI.app.panelsMenu.setData(this.getPanelMenuData());
  },

  deregisterPanel: function(panel) {
    this.panelList.remove(panel);
    isc.TEI.app.panelsMenu.setData(this.getPanelMenuData());
  },

  loadXMLReply: function(xmlDoc, xmlText) {
    this.xmlDocument = xmlDoc;
    this.mainPanel.setXMLDocument(xmlDoc);

    var self = this;
    isc.getKeys(this.dataSources).map(function(key) {
      self.dataSources[key].setXMLDocument(xmlDoc);
    });
  }
});

isc.defineClass("AnalysisTabSet", isc.TabSet).addProperties({
  initWidget: function() {
    this.tabBarControls = [
      isc.ShowLeftButton.create({target: this}),
      isc.ShowWindowButton.create({target: this}),
      isc.ShowRightButton.create({target: this}),
      "tabScroller",
      "tabPicker"
    ];

    this.Super("initWidget", arguments);
  },

  showInLeftPanel: function() {
    this.getSelectedTab().pane.showInLeftPanel();
  },

  showInRightPanel: function() {
    this.getSelectedTab().pane.showInRightPanel();
  },

  showInWindow: function() {
    this.getSelectedTab().pane.showInWindow();
  },

  removeAnalysisPanel: function(panel) {
    this.updateTab(panel.getTabID(), null); // So the pane is not destroyed
    this.removeTab(panel.getTabID());
  },

  showAnalysisPanel: function(panel) {
    this.selectTab(panel.getTabID());
  },

  addTabs: function() {
    this.Super("addTabs", arguments);
    this.showIfHasTabs();
  },

  removeTabs: function() {
    this.Super("removeTabs", arguments);
    this.showIfHasTabs();
  },

  showIfHasTabs: function() {
    if (this.getTabBar().buttons.getLength() > 0) {
      this.show();
    } else {
      this.hide();
    }
  }
});

isc.defineClass("AnalysisSectionStack", isc.SectionStack).addProperties({
  column: null, // left or right
  teiDocument: null,

  addSection: function(section) {
    this.Super("addSection", arguments);
    this.showIfHasSections();
  },

  showIfHasSections: function() {
    if (this.getSections().getLength() > 0) {
      this.show();
    } else {
      this.hide();
    }
  },

  removeSection: function() {
    this.Super("removeSection", arguments);
    this.showIfHasSections();
  },

  removeAnalysisPanel: function(panel) {
    this.removeSection(panel.getSectionStackID());
  },

  showAnalysisPanel: function(panel) {
    this.expandSection(panel.getSectionStackID());
  }
});

isc.defineClass("ShowLeftButton", isc.ImgButton).addProperties({
  target: null,
  size: 16,
  layoutAlign: "center",
  showFocused: false,
  showRollOver: false,
  showDown: false,
  src: "[SKIN]actions/freezeLeft.png",
  click: function() {
    this.target.showInLeftPanel();
  }
});

isc.defineClass("ShowRightButton", isc.ImgButton).addProperties({
  target: null,
  size: 16,
  layoutAlign: "center",
  showFocused: false,
  showRollOver: false,
  showDown: false,
  src: "[SKIN]actions/freezeRight.png",
  click: function() {
    this.target.showInRightPanel();
  }
});

isc.defineClass("ShowDockButton", isc.ImgButton).addProperties({
  target: null,
  size: 16,
  layoutAlign: "center",
  showFocused: false,
  showRollOver: false,
  showDown: false,
  src: "[SKIN]Window/collapse.png",
  click: function() {
    this.target.showInDock();
  }
});

isc.defineClass("ShowWindowButton", isc.ImgButton).addProperties({
  target: null,
  size: 16,
  layoutAlign: "center",
  showFocused: false,
  showRollOver: false,
  showDown: false,
  src: "[SKIN]actions/unfreeze.png",
  click: function() {
    this.target.showInWindow();
  }
});

isc.defineClass("AnalysisWindow", isc.Window).addProperties({
  autoCenter: true,
  width: 800,
  height: 400,
  analysisPanel: null,

  closeClick: function() {
    this.markForDestroy();
  },

  initWidget: function() {
    this.headerControls = [
      "headerIcon",
      "headerLabel",
      isc.ShowLeftButton.create({target: this.analysisPanel}),
      isc.ShowDockButton.create({target: this.analysisPanel}),
      isc.ShowRightButton.create({target: this.analysisPanel}),
      isc.LayoutSpacer.create({size: 16}),
      "minimizeButton",
      "maximizeButton",
      "closeButton"
    ];

    this.Super("initWidget", arguments);

    this.addItem(this.analysisPanel);
  },

  removeAnalysisPanel: function() {
    this.removeItem(this.analysisPanel);
    this.markForDestroy();
  },

  showAnalysisPanel: function(panel) {
    this.show();
  }
});

isc.defineClass("InterpsDataSource", "XSLTDataSource").addProperties({
  xsltName: "interpretations",
  recordXPath: "/default:interpretations/default:interp",
  fields: [
    {name: "id", type: "text", primaryKey: true},
    {name: "text", type: "text"},
    {name: "group", type: "text"}
  ]
});

isc.defineClass("InterpsGrid", isc.ListGrid).addProperties({
  autoFetchData: true,
  groupIcon: "[SKINIMG]/TreeGrid/folder.png",
  groupLeadingIndent: 0,
  groupByField: "group",
  groupStartOpen: "none",
  fields: [
    {name: "icon", type: "icon", align: "right", width: 36, canResize: false, cellIcon: "[SKINIMG]/TreeGrid/file.png"},
    {name: "text", title: "Interpretation", width: "*"},
    {name: "group", title: "Group", width: "20"}
  ]
});

isc.defineClass("NamesDataSource", "XSLTDataSource").addProperties({
  xsltName: "names",
  recordXPath: "/default:names/default:name",
  fields: [
    {name: "key", type: "text", primaryKey: true},
    {name: "type", type: "text", title: "Type"},
    {name: "text", type: "text", title: "Name"}
  ]
});

isc.defineClass("NamesGrid", isc.ListGrid).addProperties({
  autoFetchData: true,
  groupByField: "type",
  groupStartOpen: "none",
  fields: [
    {name: "text", width: "*"},
    {name: "key", width: 40},
    {name: "type", width: 20}
  ]
});

// This is the superclass for all Analysis Panels.
isc.defineClass("AnalysisPanel", isc.Canvas).addClassProperties({
  menuTitle: null,

  getMenuItem: function() {
    var self = this;
    return {
      title: this.menuTitle,
      action: function() {
        self.create({
          teiDocument: isc.TEI.app.teiDocument
        }).showInWindow();
      }
    }
  }
}).addProperties({
  width: "100%",
  height: "100%",
  container: null,

  initWidget: function() {
    this.Super("initWidget", arguments);
    this.teiDocument.registerPanel(this);
  },

  getMenuItem: function() {
    var self = this;
    return {
      title: this.getClass().menuTitle,
      action: function() {
        self.container.showAnalysisPanel(self);
      }
    }
  },

  destroy: function() {
    this.teiDocument.deregisterPanel(this);
    return this.Super("destroy", arguments);
  },

  showInWindow: function() {
    if (this.container) this.container.removeAnalysisPanel(this);
    this.container = isc.AnalysisWindow.create({
      analysisPanel: this,
      title: this.getClass().menuTitle
    });
    this.container.show();
    this.show(); // Needed when transitioning from TabSet
  },

  getSectionStackID: function() {
    return this.ID + "_stack";
  },

  getSectionStackSection: function() {
    return {
      title: this.getClass().menuTitle,
      items: [this],
      ID: this.getSectionStackID(),
      expanded: true
    };
  },

  getTabID: function() {
    return this.ID + "_tab";
  },

  getTab: function() {
    return {
      title: this.getClass().menuTitle,
      ID: this.getTabID(),
      pane: this
    };
  },

  showInRightPanel: function() {
    if (this.container) this.container.removeAnalysisPanel(this);
    this.container = this.teiDocument.rightPanel;
    this.container.addSection(isc.addProperties(this.getSectionStackSection(), {
      controls: [
        isc.ShowLeftButton.create({target: this}),
        isc.ShowWindowButton.create({target: this}),
        isc.ShowDockButton.create({target: this})
      ]
    }));
  },

  showInLeftPanel: function() {
    if (this.container) this.container.removeAnalysisPanel(this);
    this.container = this.teiDocument.leftPanel;
    this.container.addSection(isc.addProperties(this.getSectionStackSection(), {
      controls: [
        isc.ShowWindowButton.create({target: this}),
        isc.ShowDockButton.create({target: this}),
        isc.ShowRightButton.create({target: this})
      ]
    }));
  },

  showInDock: function() {
    if (this.container) this.container.removeAnalysisPanel(this);
    this.container = this.teiDocument.dock;
    this.container.addTab(this.getTab());
    this.container.selectTab(this.getTabID());;
  }
});

isc.defineClass("TOCPanel", isc.AnalysisPanel).addClassProperties({
  menuTitle: "Table of Contents"
}).addProperties({
  initWidget: function() {
    this.Super("initWidget", arguments);

    this.grid = isc.TocTreeGrid.create({
      width: "100%",
      height: "100%",
      dataSource: this.teiDocument.dataSources.tocTree
    });

    this.addChild(this.grid);
  }
});

isc.defineClass("DOMGridPanel", isc.AnalysisPanel).addClassProperties({
  menuTitle: "Document Tree"
}).addProperties({
  teiDocument: null,
  initWidget: function() {
    this.Super("initWidget", arguments);

    this.grid =  isc.DOMGrid.create({
      width: "100%",
      height: "100%"
    });

    this.grid.setRootElement(this.teiDocument.xmlDocument.documentElement);

    this.addChild(this.grid);
  }
});

isc.defineClass("NamesDialogPanel", isc.AnalysisPanel).addClassProperties({
  menuTitle: "Dialog"
}).addProperties({
  teiDocument: null,
  initWidget: function() {
    this.Super("initWidget", arguments);

    this.grid = isc.NamesGrid.create({
      dataSource: this.teiDocument.dataSources["names"],
      width: "20%",
      height: "100%",
      parent: this,
      selectionChanged: function(record, state) {
        if (state) this.parent.dialog.setParams({key: record.key});
      }
    }),

    this.dialog = isc.XSLTFlow.create({
      xmlDocument: this.teiDocument.xmlDocument,
      xsltName: "nameDialog",
      showEdges: true,
      width: "80%",
      height: "100%"
    });

    this.addChild(
      isc.HLayout.create({
        width: "100%",
        defaultHeight: "100%",
        members: [
          this.grid,
          this.dialog
        ]
      })
    );
  }
});

isc.defineClass("XSLTFlowPanel", isc.AnalysisPanel).addProperties({
  teiDocuoment: null,
  xsltName: null,
  width: "100%",
  defaultHeight: "100%",

  initWidget: function() {
    this.Super("initWidget", arguments);

    this.addChild(
      isc.XSLTFlow.create({
        defaultWidth: "100%",
        defaultHeight: "100%",
        xsltName: this.xsltName,
        xmlDocument: this.teiDocument.xmlDocument
      })
    )
  }
});

isc.defineClass("GlossaryPanel", isc.XSLTFlowPanel).addClassProperties({
  menuTitle: "Glossary"
}).addProperties({
  xsltName: "glossary"
});

isc.defineClass("HeaderPanel", isc.XSLTFlowPanel).addClassProperties({
  menuTitle: "Show Header"
}).addProperties({
  xsltName: "teiHeader"
});

isc.defineClass("NotesPanel", isc.XSLTFlowPanel).addClassProperties({
  menuTitle: "Notes"
}).addProperties({
  xsltName: "notes"
});

isc.defineClass("InterpAllNamesPanel", isc.XSLTFlowPanel).addClassProperties({
  menuTitle: "All Interpretations / Names (Containment)"
}).addProperties({
  xsltName: "interpAllNames"
});

isc.defineClass("InterpInterpXrefPanel", isc.XSLTFlowPanel).addClassProperties({
  menuTitle: "Interpretation / Interpretation (Proximity)"
}).addProperties({
  xsltName: "interpInterpXref"
});

isc.defineClass("InterpNamesProximity", isc.XSLTFlowPanel).addClassProperties({
  menuTitle: "Interpretation / Names (Proximity)"
}).addProperties({
  xsltName: "interpNamesProximity"
});

isc.defineClass("DistributionPanel", isc.AnalysisPanel).addProperties({
  teiDocument: null,
  xsltName: null,

  initWidget: function() {
    this.Super("initWidget", arguments);

    this.grid = isc.ListGrid.create({
      autoFetchData: true,
      dataSource: isc.DistributionCountDataSource.create({
        xmlDocument: this.teiDocument.xmlDocument,
        xsltName: this.xsltName,
        chapterFields: this.teiDocument.chapterFields
      })
    });

    this.graph = isc.Label.create({
      defaultValue: "Graph Here"
    });

    this.addChild(
      isc.HLayout.create({
        width: "100%",
        defaultHeight: "100%",
        members: [
          this.grid,
          this.graph
        ]
      })
    );
  }
});

isc.defineClass("DistributionDialogPanel", isc.DistributionPanel).addClassProperties({
  menuTitle: "Dialog distribution"
}).addProperties({
  xsltName: "dialogCount"
});

isc.defineClass("DistributionNamesPanel", isc.DistributionPanel).addClassProperties({
  menuTitle: "Names distribution"
}).addProperties({
  xsltName: "namesCount"
});

isc.defineClass("DistributionInterpretationsPanel", isc.DistributionPanel).addClassProperties({
  menuTitle: "Interpretations distribution"
}).addProperties({
  xsltName: "interpretationCount"
});

isc.defineClass("DistributionEverythingPanel", isc.DistributionPanel).addClassProperties({
  menuTitle: "Everything distribution"
}).addProperties({
  xsltName: "everythingCount"
});

isc.defineClass("IndexKWICPanel", isc.AnalysisPanel).addClassProperties({
  menuTitle: "Index KWIC"
}).addProperties({
  teiDocument: null,
  initWidget: function() {
    this.Super("initWidget", arguments);

    this.grid = isc.IndexGrid.create({
      dataSource: this.teiDocument.dataSources["index"],
      width: "20%",
      height: "100%",
      parent: this,
      selectionChanged: function(record, state) {
        if (state) this.parent.kwic.setParams({key: record.key});
      }
    }),

    this.kwic = isc.XSLTFlow.create({
      xmlDocument: this.teiDocument.xmlDocument,
      xsltName: "indexKwic",
      showEdges: true,
      width: "80%",
      height: "100%"
    });

    this.addChild(
      isc.HLayout.create({
        width: "100%",
        defaultHeight: "100%",
        members: [
          this.grid,
          this.kwic
        ]
      })
    );
  }
});

// This is the analysis panel for names
isc.defineClass("NamesKWICPanel", isc.AnalysisPanel).addClassProperties({
  menuTitle: "Names KWIC"
}).addProperties({
  teiDocument: null,
  initWidget: function() {
    this.Super("initWidget", arguments);

    this.grid = isc.NamesGrid.create({
      dataSource: this.teiDocument.dataSources["names"],
      width: "20%",
      height: "100%",
      parent: this,
      selectionChanged: function(record, state) {
        if (state) this.parent.kwic.setParams({key: record.key});
      }
    }),

    this.kwic = isc.XSLTFlow.create({
      xmlDocument: this.teiDocument.xmlDocument,
      xsltName: "nameKwic",
      showEdges: true,
      width: "80%",
      height: "100%"
    });

    this.addChild(
      isc.HLayout.create({
        width: "100%",
        defaultHeight: "100%",
        members: [
          this.grid,
          this.kwic
        ]
      })
    );
  }
});

isc.defineClass("InterpNamesPanel", isc.AnalysisPanel).addClassProperties({
  menuTitle: "Interpretations / Names (Containment)"
}).addProperties({
  teiDocument: null,
  initWidget: function() {
    this.Super("initWidget", arguments);

    this.grid = isc.InterpsGrid.create({
      dataSource: this.teiDocument.dataSources["interpretations"],
      width: "20%",
      height: "100%",
      parent: this,
      selectionChanged: function(record, state) {
        if (state) this.parent.names.setParams({key: record.key});
      }
    }),

    this.names = isc.XSLTFlow.create({
      xmlDocument: this.teiDocument.xmlDocument,
      xsltName: "interpNames",
      showEdges: true,
      width: "80%",
      height: "100%"
    });

    this.addChild(
      isc.HLayout.create({
        width: "100%",
        defaultHeight: "100%",
        members: [
          this.grid,
          this.names
        ]
      })
    );
  }
});

isc.defineClass("InterpsKWICPanel", isc.AnalysisPanel).addClassProperties({
  menuTitle: "Interpretations KWIC"
}).addProperties({
  teiDocument: null,
  initWidget: function() {
    this.Super("initWidget", arguments);

    this.grid = isc.InterpsGrid.create({
      dataSource: this.teiDocument.dataSources["interpretations"],
      width: "20%",
      height: "100%",
      parent: this,
      selectionChanged: function(record, state) {
        if (state) this.parent.kwic.setParams({key: record.key});
      }
    }),

    this.kwic = isc.XSLTFlow.create({
      xmlDocument: this.teiDocument.xmlDocument,
      xsltName: "interpretationKwic",
      showEdges: true,
      width: "80%",
      height: "100%"
    });

    this.addChild(
      isc.HLayout.create({
        width: "100%",
        defaultHeight: "100%",
        members: [
          this.grid,
          this.kwic
        ]
      })
    );
  }
});

isc.defineClass("IndexDataSource", "XSLTDataSource").addProperties({
  xsltName: "termList",
  recordXPath: "/default:terms/default:term",
  fields: [
    {name: "text", type: "text", title: "Term"},
    {name: "key", type: "text", primaryKey: true},
    {name: "parentKey", type: "text", foreignKey: "key"}
  ]
});

isc.defineClass("TocTreeDataSource", "XSLTDataSource").addProperties({
  xsltName: "tocTree",
  recordXPath: "/default:toc/default:tocentry",
  fields: [
    {name: "text", type: "text", title: "Title"},
    {name: "id", type: "text", title: "ID", primaryKey: true},
    {name: "n", type: "text", title: "n"},
    {name: "parentID", type: "text", foreignKey: "id"}
  ]
});

isc.defineClass("DistributionCountDataSource", "XSLTDataSource").addProperties({
  recordXPath: "/default:keys/default:key",
  init: function(options) {
    this.fields = [
      {name: "text", type: "text", title: "Key"},
      {name: "total", type: "integer", title: "Total"}
    ];
    this.fields.addList(options.chapterFields);
    return this.Super("init", arguments);
  }
});

isc.defineClass("TocTreeGrid", isc.TreeGrid).addProperties({
  autoFetchData: true,
  showHeader: false,
  loadDataOnDemand: false,
  fields: [
    {name: "text", treeField: true}
  ]
});

isc.defineClass("IndexGrid", isc.TreeGrid).addProperties({
  autoFetchData: true,
  loadDataOnDemand: false,
  fields: [
    {name: "text", treeField: true},
  ]
});

isc.defineClass("NewDocumentWindow", isc.Window).addProperties({
  autoCenter: true,
  title: "New Document",
  width: 400,
  height: 400,
  initWidget: function() {
    this.Super("initWidget", arguments);

    this.newDocumentForm = isc.NewDocumentForm.create();
    this.addItem(this.newDocumentForm);
    this.newDocumentForm.editNewRecord();
  }
});

isc.defineClass("NewDocumentForm", isc.FileUploadForm).addProperties({
  action: "/documents/upload",
  errorOrientation: "top",
  showErrorText: true,
  dataSource: "documents",
  fields: [
    {name: "original_url"},
    {name: "contents", type: "upload"},
    {name: "space", type: "spacer", height: 10},
    {
      name: "submit",
      type: "button",
      align: "center",
      colSpan: 2,
      click: function(form, item) {
        form.saveFileData();
      }
    }
  ]
});

isc.RailsDataSource.create({
  ID: "documents",
  dataURL: "/documents",
  fields: [
    {name: "id", type: "integer", primaryKey: true, canEdit: false},
    {name: "original_url", type: "text", length: 255},
    {name: "title", type: "text", length: 255}
  ]
});

isc.defineClass("DocumentList", isc.VLayout).addProperties({
  showEdges: true,

  initWidget: function() {
    this.Super("initWidget", arguments);

    this.grid = isc.ListGrid.create({
      dataSource: "documents",
      autoFetchData: true,
      selectionModel: "single",
      fields: [
        {name: "title"},
        {name: "original_url"}
      ],
      doOpenSelection: function() {
        isc.TEI.app.doOpenDocument (this.getSelectedRecord());
      },
      doDeleteSelection: function() {
        var grid = this;
        this.getSelection().map(function(record) {
          grid.removeData(record);
        });
      },
      doNew: function() {
        isc.TEI.app.doNewDocument();
      }
    });

    this.menuBar = isc.Toolbar.create({
      buttons: [
        isc.GridButtonNew.create({
          target: this.grid
        }),
        isc.GridButtonOpen.create({
          target: this.grid
        }),
        isc.GridButtonDelete.create({
          target: this.grid
        })
      ]
    });

    this.addMembers([
      this.menuBar,
      this.grid
    ])
  }
});

isc.Page.setEvent("load", function() {
  var app = isc.TEI.create();
  app.draw();
}, isc.Page.FIRE_ONCE);
