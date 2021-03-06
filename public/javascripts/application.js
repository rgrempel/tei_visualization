isc.setAutoDraw(false);

isc.defineClass("AppMenu", isc.Menu).addProperties({
  width: 100,
  canHover: true,
  hoverDelay: 1200,
  hoverWidth: 200,
  cellHoverHTML: function(record, rowNum, colNum) {
    return record.hoverText;
  }
});

isc.defineClass("TEI");

isc.TEI.addClassProperties({
  app: null
});

isc.TEI.addProperties({
  init: function () {
    this.Super("init", arguments);

    isc.TEI.app = this;

    this.initAuthorization();

    this.cssRules = isc.CSSRules.create();

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

    this.panelsMenu = isc.AppMenu.create({
      title: "Panels"
    });

    this.menuBar = isc.MenuBar.create({
      menus: [
        isc.AppMenu.create({
          title: "Documents",
          data: [
            {
              title: "New",
              action: function() {
                isc.TEI.app.doNewDocument();
              },
              hoverText: "Upload a new TEI document, or provide a URL"
            },
            {
              title: "Open",
              action: function() {
                isc.TEI.app.showDocumentList();
              },
              hoverText: "Open a TEI document that was previously uploaded"
            }
          ]
        }),
        isc.AppMenu.create({
          title: "KWIC",
          width: 100,
          data: [
            isc.NamesKWICPanel.getMenuItem(),
            isc.NamesDialogPanel.getMenuItem(),
            isc.IndexKWICPanel.getMenuItem(),
            isc.InterpsKWICPanel.getMenuItem()
          ]
        }),
        isc.AppMenu.create({
          title: "Structure",
          width: 100,
          data: [
            isc.HeaderPanel.getMenuItem(),
            isc.DOMGridPanel.getMenuItem(),
            isc.TOCPanel.getMenuItem()
          ]
        }),
        isc.AppMenu.create({
          title: "XRef",
          width: 100,
          data: [
            isc.GlossaryPanel.getMenuItem(),
            isc.NotesPanel.getMenuItem()
          ]
        }),
        isc.AppMenu.create({
          title: "Counting",
          width: 100,
          data: [
            isc.InterpNamesPanel.getMenuItem(),
            isc.InterpAllNamesPanel.getMenuItem(),
            isc.InterpNamesProximity.getMenuItem(),
            isc.InterpInterpXrefPanel.getMenuItem()
          ]
        }),
        isc.AppMenu.create({
          title: "Distribution",
          width: 100,
          data: [
            isc.DistributionNamesPanel.getMenuItem(),
            isc.DistributionInterpretationsPanel.getMenuItem(),
            isc.DistributionDialogPanel.getMenuItem(),
            isc.DistributionEverythingPanel.getMenuItem()
          ]
        }),
        this.panelsMenu,
        isc.AppMenu.create({
          title: "Debug",
          data: [
            {
              title: "Show Console",
              action: function() {
                isc.showConsole();
              },
              hoverText: "Show SmartClient Debugging Console"
            }
          ]
        })
      ]
    });

    this.documentArea = isc.Canvas.create({
      width: "100%",
      height: "100%"
    });

    this.documentArea.addChild(isc.HTMLPane.create({
      height: "100%",
      width: "100%",
      contentsURL: "/about.html"
    }));

    this.navigation = isc.VLayout.create({
      width: "100%",
      height: "100%",
      members: [
        isc.HLayout.create({
          width: "100%",
          members: [
            this.menuBar,
            isc.LoginButton.create()
          ]
        }),
        this.documentArea
      ]
    });

    if (!isc.Browser.isFirefox) {
      isc.say("Note that this site only works properly in Firefox, because it uses XSLT features that only Firefox supports");
    }
  },

  showDocumentList: function() {
    this.documentWindow.show();
  },

  draw: function() {
    this.navigation.draw();
  },

  doOpenDocument: function(doc) {
    this.documentWindow.hide();
    if (this.newDocumentWindow) this.newDocumentWindow.hide();
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

  getBoundDataSource: function(dataSourceClass) {
    var className = dataSourceClass.getClassName();
    if (!this.dataSources[className]) {
      var dataSource = dataSourceClass.create({
        xmlDocument: this.xmlDocument
      })
      this.dataSources[className] = dataSource
    }
    return this.dataSources[className];
  },

  initWidget: function(){
    this.Super("initWidget", arguments);

    this.setTitle(this.record.title);
    this.panelList = [];
    this.dataSources = {};

    var self = this;
    this.getBoundDataSource(isc.TocTreeDataSource).fetchData(null, function(dsResponse, data) {
      var fields = [];

      data.map(function(chapter) {
        fields.add({name: chapter.n, type: "integer", valueXPath: "default:div[@n='" + chapter.n + "']/@count"});
      });

      self.setChapterFields(fields);
    });

    this.mainPanel = isc.MainPanel.create({
      teiDocument: this,
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
      isc.rpc.sendRequest({
        actionURL: "/documents/" + this.record.id + ".tei",
        httpMethod: "GET",
        useSimpleHttp: true,
        serverOutputAsString: false,
        bypassCache: true,
        callback: {target: this, methodName: "loadXMLReply"}
      });
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
    isc.TEI.app.cssRules.clearRules();

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

  handleScrolled: function() {
    if (this.scrolling) return;

    if (!this.divs) {
      var divs = this.selectNodes('descendant::div[@class="div"]');
      if (divs.getLength() > 0) {
        this.divs = divs;
      } else {
        return;
      }
    }

    var scrollTop = this.mainPanel.getScrollTop();
    var length = this.divs.getLength();
    var target = null;

    for (var x = length - 1; x >= 0; x--) {
      target = this.divs.get(x);
      if (isc.Element.getOffsetTop(target) <= scrollTop) break;
    }

    this.fireScrolledToDiv(target);
  },

  scrollToElement: function(element) {
    this.scrolling = true;
    var self = this;
    this.mainPanel.scrollToElement(element, function(){
      self.scrolling = false;
      self.handleScrolled();
    });
  },

  findPanelClass: function(panelClass) {
    var panel = null;
    this.panelList.map(function(eachPanel) {
      if (eachPanel.getClassName() == panelClass) panel = eachPanel;
    });
    return panel;
  },

  doHandleScrollTo: function(panelClass, scrollTo) {
    if (panelClass == "MainPanel") {
      this.scrollToID(scrollTo);
    } else {
      var panel = this.findPanelClass(panelClass);
      if (panel) {
        panel.show();
        panel.scrollToID(scrollTo);
      } else {
        panel = isc[panelClass].create({
          teiDocument: this,
          scrollToOnCreation: scrollTo
        });
        panel.showInWindow();
      }
    }
  },

  fireScrolledToDiv: function(element) {
    // for observation
    return element;
  },

  loadXMLReply: function(dsResponse, data, dsRequest) {
    var xmlDoc = isc.XMLDoc.create(dsResponse.xmlHttpRequest.responseXML);

    this.xmlDocument = xmlDoc;
    this.mainPanel.setXMLDocument(xmlDoc);

    var self = this;
    isc.getKeys(this.dataSources).map(function(key) {
      self.dataSources[key].setXMLDocument(xmlDoc);
    });
  }
});

isc.defineClass("MainPanel", isc.XSLTFlow).addProperties({
  teiDocument: null,
  xsltName: "main",
  lastMouseCheck: new Date().getTime(),
  minMouseDelta: 200,
  lastHoverElement: null,

  mouseMove: function() {
    var time = new Date().getTime();
    if ((time - this.lastMouseCheck) < this.minMouseDelta) return;

    this.lastMouseCheck = time;

    var hover = isc.EventHandler.findTarget("ancestor-or-self::*[@hover]");

    if (this.lastHoverElement != hover) {
      if (this.lastHoverElement) {
        isc.Hover.clear();
        this.lastHoverElement = null;
      }

      if (hover) {
        this.lastHoverElement = hover;
        isc.Hover.setAction(this, this.doHoverElement);
      }
    }
  },

  doHoverElement: function() {
    isc.Hover.show(this.lastHoverElement.getAttribute("hover"));
  },

  scrolled: function() {
    this.teiDocument.handleScrolled();
  },

  showContextMenu: function() {
    var self = this;
    var menuItems = [];

    var lg = isc.EH.findTarget('ancestor-or-self::div[@class="lg"]');
    if (lg) {
      var title = "Float Line Group";
      menuItems.add({
        title: title,
        action: function() {
          self.doFloatSection(this.title, lg);
        }
      });
    }

    var chapter = isc.EH.findTarget('ancestor-or-self::div[@class="div"]');
    if (chapter) {
      var title =  "Float " + (chapter.getAttribute("type") || "section");
      menuItems.add({
        title: title,
        action: function() {
          self.doFloatSection(this.title, chapter);
        }
      });
    }

    if (menuItems.getLength() > 0) {
      var menu = isc.Menu.create({
        data: menuItems
      });
      menu.showContextMenu();
      return false;
    } else {
      return true;
    }
  },

  doFloatSection: function(title, node) {
    isc.FloatingMainPanel.create({
      teiDocument: this.teiDocument,
      menuTitle: title,
      originalNode: node
    }).showInWindow();
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
  canHover: true,
  getHoverHTML: function() {
    return "Move to left-hand column"
  },
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
  canHover: true,
  getHoverHTML: function() {
    return "Move to right-hand column"
  },
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
  canHover: true,
  getHoverHTML: function() {
    return "Move to the dock"
  },
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
  canHover: true,
  getHoverHTML: function() {
    return "Show in a window"
  },
  src: "[SKIN]actions/unfreeze.png",
  click: function() {
    this.target.showInWindow();
  }
});

isc.defineClass("AnalysisWindow", isc.Window).addProperties({
  width: 800,
  height: 400,
  analysisPanel: null,

  canDragReposition: true,
  canDragResize: true,
  keepInParentRect: true,
  showFooter: true,
  showMaximizeButton: true,
  showResizer: true,

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
  teiDocument: null,
  autoFetchData: true,
  groupIcon: "[SKINIMG]/TreeGrid/folder.png",
  groupLeadingIndent: 0,
  groupByField: "group",
  groupStartOpen: "none",
  fields: [
    {name: "icon", type: "icon", align: "right", width: 36, canResize: false, cellIcon: "[SKINIMG]/TreeGrid/file.png"},
    {name: "text", title: "Interpretation", width: "*"},
    {name: "group", title: "Group", width: "20"}
  ],
  initWidget: function() {
    this.dataSource = this.teiDocument.getBoundDataSource(isc.InterpsDataSource);
    this.Super("initWidget", arguments);
  }
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
  teiDocument: null,
  autoFetchData: true,
  groupByField: "type",
  groupStartOpen: "none",
  fields: [
    {name: "text", width: "*"},
    {name: "key", width: 40},
    {name: "type", width: 20}
  ],
  initWidget: function() {
    this.dataSource = this.teiDocument.getBoundDataSource(isc.NamesDataSource);
    this.Super("initWidget", arguments);
  }
});

// This is the superclass for all Analysis Panels.
isc.defineClass("AnalysisPanel", isc.Canvas).addClassProperties({
  menuTitle: null,
  hoverText: null,

  getMenuItem: function() {
    var self = this;
    return {
      title: this.menuTitle,
      hoverText: this.hoverText,
      action: function() {
        self.create({
          teiDocument: isc.TEI.app.teiDocument
        }).showInWindow();
      },
      enableIf: function(target, menu, item) {
        return isc.TEI.app.teiDocument ? true : false;
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
      title: this.getMenuTitle(),
      hoverText: this.getHoverText(),
      action: function() {
        self.container.showAnalysisPanel(self);
      }
    }
  },

  getMenuTitle: function() {
    return this.menuTitle || this.getClass().menuTitle;
  },

  getHoverText: function() {
    return this.hoverText || this.getClass().hoverText;
  },

  destroy: function() {
    this.teiDocument.deregisterPanel(this);
    return this.Super("destroy", arguments);
  },

  showInWindow: function() {
    if (this.container) this.container.removeAnalysisPanel(this);
    this.container = isc.AnalysisWindow.create({
      analysisPanel: this,
      title: this.getMenuTitle()
    });
    this.teiDocument.addChild(this.container);
    this.container.show();
    this.show(); // Needed when transitioning from TabSet
  },

  getSectionStackID: function() {
    return this.ID + "_stack";
  },

  getSectionStackSection: function() {
    return {
      title: this.getMenuTitle(),
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
      title: this.getMenuTitle(),
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

isc.defineClass("FloatingMainPanel", isc.AnalysisPanel).addProperties({
  originalNode: null,

  initWidget: function() {
    this.Super("initWidget", arguments);

    s = new XMLSerializer();
    this.setContents(s.serializeToString(this.originalNode));
  }
});

isc.defineClass("TOCPanel", isc.AnalysisPanel).addClassProperties({
  menuTitle: "Table of Contents",
  hoverText: "Show the document's Table of Contents"
}).addProperties({
  initWidget: function() {
    this.Super("initWidget", arguments);

    this.grid = isc.TocTreeGrid.create({
      width: "100%",
      height: "100%",
      teiDocument: this.teiDocument,
      dataSource: this.teiDocument.getBoundDataSource(isc.TocTreeDataSource)
    });

    this.addChild(this.grid);
  }
});

isc.defineClass("DOMGridPanel", isc.AnalysisPanel).addClassProperties({
  menuTitle: "Document Tree",
  hoverText: "Show an outline of the structure of the TEI document"
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

isc.XSLTFlow.addProperties({
  click: function() {
    var scrollTarget = isc.EventHandler.findTarget("ancestor-or-self::*[@scrollTo]");
    if (scrollTarget) {
      isc.TEI.app.teiDocument.doHandleScrollTo(
        scrollTarget.getAttribute("panelClass"),
        scrollTarget.getAttribute("scrollTo")
      );
    }
  }
});

isc.defineClass("KWICFlow", isc.XSLTFlow).addProperties({
  updateSizes: function() {
    this.selectNodes('descendant::div[@class="kwic-entry"]').map(function(kwicEntry) {
      var kwicText = isc.XMLTools.selectNodes(kwicEntry, 'descendant::span[@class="kwic-entry-text"]').get(0);
      var kwicPreceding = isc.XMLTools.selectNodes(kwicEntry, 'descendant::span[@class="kwic-preceding"]').get(0);
      var kwicFollowing = isc.XMLTools.selectNodes(kwicEntry, 'descendant::span[@class="kwic-following"]').get(0);

      kwicFollowing.style.top = kwicPreceding.style.top = String(isc.Element.getOffsetTop(kwicText)) + "px";
      kwicPreceding.style.width = String(isc.Element.getOffsetLeft(kwicText)) + "px";
      kwicFollowing.style.left = String(isc.Element.getOffsetLeft(kwicText) + isc.Element.getNativeInnerWidth(kwicText)) + "px";

      kwicEntry.style.height = String(Math.max(
        isc.Element.getInnerHeight(kwicText) + isc.Element.getOffsetTop(kwicText),
        isc.Element.getInnerHeight(kwicPreceding) + isc.Element.getOffsetTop(kwicText),
        isc.Element.getInnerHeight(kwicFollowing) + isc.Element.getOffsetTop(kwicText)
      )) + "px";
    });

    this.adjustForContent();
  },

  redraw: function() {
    this.getHandle().style.visibility = "hidden";
    this.Super("redraw", arguments);
    this.updateSizes();
    this.getHandle().style.visibility = "visible";
  },

  innerSizeChanged: function() {
    this.updateSizes();
    return this.Super("innerSizeChanged", arguments);
  }
});

isc.defineClass("CSSRules").addProperties({
  legalStyles: ["color", "backgroundColor"],

  init: function() {
    this.Super("init", arguments);

    // cssRules is a cache of the actual rules in the actual stylesheet
    this.cssRules = {};

    var head = document.documentElement.firstChild;
    var title = "Dynamic-Styles";
    isc.Element.insertAdjacentHTML(head, "afterBegin", "<style type='text/css' title='" + title + "' />", true);

    for (var i = 0; i < document.styleSheets.length; i++) {
      if (document.styleSheets[i].title == title) {
        this.stylesheet = document.styleSheets[i];
        break;
      }
    }

    return this;
  },

  setRule: function(selector, styles) {
    var cssRule = this.cssRules[selector];

    if (!cssRule) {
      this.stylesheet.insertRule(selector + " {}", 0);
      cssRule = this.cssRules[selector] = this.stylesheet.cssRules[0];
    }

    this.legalStyles.map(function(style) {
      if (styles[style]) cssRule.style[style] = styles[style];
    });

    return selector;
  },

  getRule: function(selector) {
    var result = {};
    var rule = this.cssRules[selector];
    if (rule) {
      this.legalStyles.map(function(style) {
        if (rule.style[style]) result[style] = rule.style[style];
      });
    }
    return result;
  },

  clearRules: function() {

  }
});

isc.defineClass("KWICPanel", isc.AnalysisPanel).addProperties({
  teiDocument: null,
  gridConstructor: null,
  kwicXSLTName: null,

  key: null,
  kwicLength: 60,

  initWidget: function() {
    this.Super("initWidget", arguments);

    this.grid = isc[this.gridConstructor].create({
      teiDocument: this.teiDocument,
      width: "20%",
      height: "100%",
      parent: this,
      showResizeBar: true,
      selectionChanged: function(record, state) {
        if (state) this.parent.handleGridSelection(record);
      }
    });

    this.kwic = isc.KWICFlow.create({
      xmlDocument: this.teiDocument.xmlDocument,
      xsltName: this.kwicXSLTName,
      showEdges: true,
      width: "100%",
      height: "100%"
    });

    this.slider = isc.Slider.create({
      parent: this,
      minValue: 0,
      maxValue: 200,
      vertical: false,
      labelWidth: 80,
      extraSpace: 10,
      value: 60,
      title: "KWIC Length",
      timerMS: 200,
      timerID: null,
      valueChanged: function(value) {
        this.Super("valueChanged", arguments);
        if (this.timerID) isc.Timer.clear(this.timerID);
        this.timerID = this.parent.delayCall("setKWICLength", [value], this.valueIsChanging() ? this.timerMS : 0);
      }
    });

    this.cssForm = isc.DynamicForm.create({
      creator: this,
      numCols: 2,
      layoutAlign: "center",
      fields: [
        {name: "color", title: "Colour", type: "color", defaultValue: "#000000", width: 85},
        {name: "backgroundColor", title: "Background Colour", type: "color", defaultValue: "#FFFFFF", width: 85}
      ],
      itemChanged: function(item, newValue) {
        this.creator.handleEditCSS(this.getValues());
      }
    });

    this.observe(isc.TEI.app.cssRules, "setRule", "observer.handleSetRule(returnVal)");

    this.addChild(
      isc.HLayout.create({
        width: "100%",
        defaultHeight: "100%",
        members: [
          this.grid,
          isc.VLayout.create({
            width: "80%",
            height: "100%",
            members: [
              this.kwic,
              isc.HLayout.create({
                width: "100%",
                members: [
                  this.slider,
                  this.cssForm
                ]
              })
            ]
          })
        ]
      })
    );
  },

  handleEditCSS: function(values) {
    var record = this.grid.getSelectedRecord();
    if (record) {
      isc.TEI.app.cssRules.setRule(this.selectorForRecord(record), values);
    }
  },

  handleSetRule: function(selector) {
    var record = this.grid.getSelectedRecord();
    if (record && selector == this.selectorForRecord(record)) {
      this.cssForm.editRecord(isc.TEI.app.cssRules.getRule(selector));
    }
  },

  selectorForRecord: function(record) {
    // this is meant to be subclassed ...
    return "";
  },

  handleGridSelection: function(record) {
    this.setKey(record.key);
    var selector = this.selectorForRecord(record);
    var cssRecord = isc.TEI.app.cssRules.getRule(selector);
    if (cssRecord) {
      this.cssForm.editRecord(cssRecord);
    } else {
      this.cssForm.editNewRecord();
    }
  },

  setKey: function(key) {
    this.key = key;
    this.setParams();
  },

  setKWICLength: function(length) {
    this.kwicLength = length;
    this.setParams();
  },

  setParams: function() {
    this.kwic.setParams ({
      key: this.key,
      'kwic-length': this.kwicLength
    });
  }
});

isc.defineClass("NamesDialogPanel", isc.KWICPanel).addClassProperties({
  menuTitle: "Dialog",
  hoverText: "Show the &lt;said&gt; tags with context"
}).addProperties({
  menuTitle: "Dialog KWIC",
  teiDocument: null,
  gridConstructor: "NamesGrid",
  kwicXSLTName: "nameDialog",
  selectorForRecord: function(record) {
    return "div.said[who='" + record.key + "']";
  }
});

isc.defineClass("XSLTFlowPanel", isc.AnalysisPanel).addProperties({
  teiDocuoment: null,
  xsltName: null,
  width: "100%",
  defaultHeight: "100%",

  scrollToID: function(id, callback) {
    this.flow.scrollToID(id, callback);
  },

  scrollToElement: function(element) {
    this.flow.scrollToElement(element);
  },

  initWidget: function() {
    this.Super("initWidget", arguments);

    this.flow = isc.XSLTFlow.create({
      defaultWidth: "100%",
      defaultHeight: "100%",
      xsltName: this.xsltName,
      xmlDocument: this.teiDocument.xmlDocument,
      scrollToOnCreation: this.scrollToOnCreation
    });

    this.addChild(this.flow);
  }
});

isc.defineClass("GlossaryPanel", isc.XSLTFlowPanel).addClassProperties({
  menuTitle: "Glossary",
  hoverText: "Show Glossary entries"
}).addProperties({
  xsltName: "glossary"
});

isc.defineClass("HeaderPanel", isc.XSLTFlowPanel).addClassProperties({
  menuTitle: "Header",
  hoverText: "Show the TEI Header"
}).addProperties({
  xsltName: "teiHeader"
});

isc.defineClass("NotesPanel", isc.XSLTFlowPanel).addClassProperties({
  menuTitle: "Notes",
  hoverText: "Show notes defined in the TEI document"
}).addProperties({
  xsltName: "notes"
});

isc.defineClass("InterpAllNamesPanel", isc.XSLTFlowPanel).addClassProperties({
  menuTitle: "All Interpretations / Names (Containment)",
  hoverText: "Count cross-references between interpretations and names, where 'hits' are counted when one contains another"
}).addProperties({
  xsltName: "interpAllNames"
});

isc.defineClass("InterpInterpXrefPanel", isc.XSLTFlowPanel).addClassProperties({
  menuTitle: "Interpretation / Interpretation (Proximity)",
  hoverText: "Count cross-references among interpretations, where 'hits' are counted when one is in the same paragraph (or line group) as the other"
}).addProperties({
  xsltName: "interpInterpXref"
});

isc.defineClass("InterpNamesProximity", isc.XSLTFlowPanel).addClassProperties({
  menuTitle: "Interpretation / Names (Proximity)",
  hoverText: "Count cross-references between interpretations and names, where 'hits' are counted when one is the same paragraph (or line gropu) as the other"
}).addProperties({
  xsltName: "interpNamesProximity"
});

isc.defineClass("DistributionPanel", isc.AnalysisPanel).addProperties({
  teiDocument: null,
  xsltName: null,

  initWidget: function() {
    this.Super("initWidget", arguments);

    this.grid = isc.ListGrid.create({
      defaultWidth: "*",
      creator: this,
      teiDocument: this.teiDocument,
      autoFetchData: true,
      dataSource: isc.DistributionCountDataSource.create({
        xmlDocument: this.teiDocument.xmlDocument,
        xsltName: this.xsltName,
        chapterFields: this.teiDocument.chapterFields
      }),
      showResizeBar: true,
      resizeBarTarget: "next",
      chartConstructor: "BluffChart",
      chartProperties: {
        width: "100%",
        height: "100%"
      },
      selectionChanged: function(record, state) {
        var selectedRecords = this.getSelection();
        if (selectedRecords.getLength() > 0) {
          var chart = this.chartData("text", this.teiDocument.chapterFields.map(function(field) {
            return field.name;
          }), selectedRecords, {labelField: "text"});
          this.creator.setGraph(chart);
        } else {
          this.creator.setGraph(null);
        }
      }
    });

    this.graph = isc.Canvas.create({
      width: "33%",
      height: "100%"
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

    this.setGraph(null);
  },

  setGraph: function(newGraph) {
    if (this.graph.children) this.graph.removeChild(this.graph.children.get(0));
    if (newGraph) {
      this.graph.addChild(newGraph);
    } else {
      this.graph.addChild(isc.Label.create({
        contents: "Select row(s) to graph",
        align: "center",
        valign: "center",
        width: "100%",
        height: "100%"
      }));
    }
  }
});

isc.defineClass("DistributionDialogPanel", isc.DistributionPanel).addClassProperties({
  menuTitle: "Dialog",
  hoverText: "Show how many times each speaker has dialog (&lt;said&gt; tags) in each chapter (or other &lt;div&gt;)"
}).addProperties({
  menuTitle: "Dialog (Distribution)",
  xsltName: "dialogCount"
});

isc.defineClass("DistributionNamesPanel", isc.DistributionPanel).addClassProperties({
  menuTitle: "Names",
  hoverText: "Show how many times each name is marked in each chapter (or other &lt;div&gt;)"
}).addProperties({
  menuTitle: "Names (Distribution)",
  xsltName: "namesCount"
});

isc.defineClass("DistributionInterpretationsPanel", isc.DistributionPanel).addClassProperties({
  menuTitle: "Interpretations",
  hoverText: "Show how many times each interpretation is marked in each chapter (or other &lt;div&gt;)"
}).addProperties({
  menuTitle: "Interpretations (Distribution)",
  xsltName: "interpretationCount"
});

isc.defineClass("DistributionEverythingPanel", isc.DistributionPanel).addClassProperties({
  menuTitle: "Everything",
  hoverText: "Show how many times dialog, names and interpretations are marked in each chapter (or other &lt;div&gt;)"
}).addProperties({
  menuTitle: "Everything (Distribution)",
  xsltName: "everythingCount"
});

isc.defineClass("IndexKWICPanel", isc.KWICPanel).addClassProperties({
  menuTitle: "Index",
  hoverText: "Show index entries from the TEI document"
}).addProperties({
  menuTitle: "Index (KWIC)",
  teiDocument: null,
  gridConstructor: "IndexGrid",
  kwicXSLTName: "indexKwic",
  selectorForRecord: function(record) {
    return "div.p div.term[key='" + record.key + "']";
  }
});

isc.defineClass("NamesKWICPanel", isc.KWICPanel).addClassProperties({
  menuTitle: "Names",
  hoverText: "Show names and referring strings with context"
}).addProperties({
  menuTitle: "Names (KWIC)",
  teiDocument: null,
  gridConstructor: "NamesGrid",
  kwicXSLTName: "nameKwic",
  selectorForRecord: function(record) {
    return "div.name[key='" + record.key + "'], div.rs[key='" + record.key + "']";
  }
});

isc.defineClass("InterpNamesPanel", isc.AnalysisPanel).addClassProperties({
  menuTitle: "Interpretations / Names (Containment)",
  hoverText: "Count cross-references between interpretations and names, where 'hits' are counted when one contains the other"
}).addProperties({
  teiDocument: null,
  initWidget: function() {
    this.Super("initWidget", arguments);

    this.grid = isc.InterpsGrid.create({
      teiDocument: this.teiDocument,
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

isc.defineClass("InterpsKWICPanel", isc.KWICPanel).addClassProperties({
  menuTitle: "Interpretations",
  hoverText: "Show interpretations with context"
}).addProperties({
  menuTitle: "Interpretations (KWIC)",
  teiDocument: null,
  gridConstructor: "InterpsGrid",
  kwicXSLTName: "interpretationKwic",
  selectorForRecord: function(record) {
    return "div[ana~='#" + record.key + "']";
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
  teiDocument: null,
  autoFetchData: true,
  showHeader: false,
  loadDataOnDemand: false,
  selectionType: "single",
  handlingSelection: false,

  fields: [
    {name: "text", treeField: true}
  ],

  selectionChanged: function(record, state) {
    if (this.handlingSelection) return;
    this.handlingSelection = true;
    if (state) {
      this.handlingSelectionChanged = true;
      this.teiDocument.scrollToID(record.id);
      this.handlingSelectionChanged = false;
    }
    this.handlingSelection = false;
  },

  initWidget: function() {
    this.Super("initWidget", arguments);
    this.observe(this.teiDocument, "fireScrolledToDiv", "observer.handleScrollToDiv(returnVal)");
  },

  handleScrollToDiv: function(div) {
    if (this.handlingSelection) return;
    this.handlingSelection = true;

    var selection = this.getSelectedRecord();
    var id = div.getAttribute("id");
    if (selection) {
      if (selection.id == id) {
        this.handlingSelection = false;
        return;
      } else {
        this.selectRecord(selection, false);
      }
    }

    this.selectRecord(this.data.find({
      id: div.getAttribute("id")
    }));

    this.handlingSelection = false;
  }
});

isc.defineClass("IndexGrid", isc.TreeGrid).addProperties({
  teiDocument: null,
  autoFetchData: true,
  loadDataOnDemand: false,
  fields: [
    {name: "text", treeField: true},
  ],
  initWidget: function() {
    this.dataSource = this.teiDocument.getBoundDataSource(isc.IndexDataSource);
    this.Super("initWidget", arguments);
  }
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
    {type: "spacer", height: 10},
    {name: "body", type: "header", defaultValue: "Upload TEI Document"},
    {type: "spacer", height: 10},
    {name: "blurb", type: "blurb", wrap: true, defaultValue: "Either enter a complete URL where the document can be found, or upload a file from your own computer"},
    {name: "original_url", width: 280},
    {name: "contents", type: "upload", title: "File to Upload"},
    {type: "spacer", height: 10},
    {name: "allow_public"},
    {type: "spacer", height: 10},
    {
      name: "submit",
      type: "button",
      align: "center",
      colSpan: 2,
      click: function(form, item) {
        form.saveFileData({target: form, methodName: "handleReply"});
      }
    }
  ],
  handleReply: function(dsResponse, data, dsRequest) {
    if (dsResponse.status == 0) {
      isc.TEI.app.doOpenDocument(data);
    }
  }
});

isc.RailsDataSource.create({
  ID: "documents",
  dataURL: "/documents",
  fields: [
    {name: "id", type: "integer", primaryKey: true, canEdit: false},
    {name: "original_url", type: "text", title: "Download from URL", length: 255},
    {name: "title", type: "text", length: 255},
    {name: "allow_public", type: "boolean", title: "Allow anyone to read", defaultValue: true}
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
        {name: "title"}
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
      },
      recordDoubleClick: function(viewer, record, recordNum, field, fieldNum, value, rawValue) {
        isc.TEI.app.doOpenDocument(record);
      }
    });

    this.grid.observe(isc.TEI.app, "fireLogin", "observer.invalidateCache()");
    this.grid.observe(isc.TEI.app, "fireLogout", "observer.invalidateCache()");

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
