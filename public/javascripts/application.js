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
            {
              title: "Names KWIC",
              action: function() {
                isc.TEI.app.teiDocument.showNamesKWIC();
              }
            },
            {
              title: "Names Dialog",
              action: function() {
                isc.TEI.app.teiDocument.showNamesDialog();
              }
            },
            {
              title: "Index KWIC",
              action: function() {
                isc.TEI.app.teiDocument.showIndexKWIC();
              }
            },
            {
              title: "Interpretations KWIC",
              action: function() {
                isc.TEI.app.teiDocument.showInterpretationsKWIC();
              }
            },
            {
              title: "Glossary",
              action: function() {
                isc.TEI.app.teiDocument.showGlossary();
              }
            },
            {
              title: "Notes",
              action: function() {
                isc.TEI.app.teiDocument.showNotes();
              }
            },
            {
              title: "Header",
              action: function() {
                isc.TEI.app.teiDocument.showHeader();
              }
            },
            {
              title: "Document Tree",
              action: function() {
                isc.TEI.app.teiDocument.showDOMGrid();
              }
            }
          ]
        },
        {
          title: "Counting",
          width: 100,
          data: [
            {
              title: "Interpretations / Names (Contains/Contained)",
              action: function() {
                isc.TEI.app.teiDocument.showInterpNames();
              }
            }
          ]
        },
        {
          title: "Distribution",
          width: 100,
          data: [
            {
              title: "Names",
              action: function() {
                isc.TEI.app.teiDocument.showDistributionNames();
              }
            },
            {
              title: "Titles",
              action: function() {
                isc.TEI.app.teiDocument.showDistributionTitles();
              }
            },
            {
              title: "Interpretations",
              action: function() {
                isc.TEI.app.teiDocument.showDistributionInterpretations();
              }
            },
            {
              title: "Everything",
              action: function() {
                isc.TEI.app.teiDocument.showDistributionEverything();
              }
            }
          ]
        },
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

  initWidget: function(){
    this.Super("initWidget", arguments);

    this.setTitle(this.record.title);

    this.dataSources = {
      tocTree: isc.TocTreeDataSource.create(),
      index: isc.IndexDataSource.create(),
      names: isc.NamesDataSource.create(),
      interpretations: isc.InterpsDataSource.create()
    };

    this.mainPanel = isc.XSLTFlow.create({
      xsltName: "main",
      width: "*",
      height: "100%",
      showResizeBar: true,
      resizeBarTarget: "next"
    });

    this.tocPanel = isc.TocTreeGrid.create({
      width: "100%",
      height: "100%",
      dataSource: this.dataSources.tocTree
    });

    this.rightPanel = isc.VLayout.create({
      width: 200,
      height: "100%",
      showEdges: true,
      members: [
        this.tocPanel
      ]
    });

    if (this.record) {
      isc.XMLTools.loadXML("/documents/" + this.record.id + ".tei", {target: this, methodName: "loadXMLReply"}, {bypassCache: false});
    }

    this.dock = isc.TabSet.create({
      height: 100,
      width: "100%"
    });

    this.addItem(
      isc.VLayout.create({
        members: [
          isc.HLayout.create({
            height: "*",
            showResizeBar: true,
            resizeBarTarget: "next",
            members: [
              this.mainPanel,
              this.rightPanel
            ]
          }),
          this.dock
        ]
      })
    );
  },

  destroy: function() {
    delete this.dataSources;
    delete this.xmlDocument;

    return this.Super("destroy", arguments);
  },

  closeClick: function() {
    this.markForDestroy();
  },

  loadXMLReply: function(xmlDoc, xmlText) {
    this.xmlDocument = xmlDoc;
    this.mainPanel.setXMLDocument(xmlDoc);

    var self = this;
    isc.getKeys(this.dataSources).map(function(key) {
      self.dataSources[key].setXMLDocument(xmlDoc);
    });
  },

  showDOMGrid: function() {
    var grid =  isc.DOMGrid.create({
      width: "100%",
      height: "100%"
    });

    isc.Window.create({
      autoCenter: true,
      width: 800,
      height: 600,
      closeClick: function() {
        this.markForDestroy();
      },
      items: [
        grid
      ]
    }).show();

    grid.setRootElement(this.xmlDocument.documentElement);
  },

  showInterpNames: function() {
    isc.Window.create({
      autoCenter: true,
      width: 800,
      height: 400,
      closeClick: function() {
        this.markForDestroy();
      },
      items: [
        isc.InterpNamesPanel.create({
          height: "100%",
          teiDocument: this
        })
      ]
    }).show();
  },

  showIndexKWIC: function() {
    isc.Window.create({
      autoCenter: true,
      width: 800,
      height: 400,
      closeClick: function() {
        this.markForDestroy();
      },
      items: [
        isc.IndexKWICPanel.create({
          height: "100%",
          teiDocument: this
        })
      ]
    }).show();
  },

  showGlossary: function() {
    isc.Window.create({
      autoCenter: true,
      width: 800,
      height: 400,
      closeClick: function() {
        this.markForDestroy();
      },
      items: [
        isc.GlossaryPanel.create({
          height: "100%",
          width: "100%",
          xmlDocument: this.xmlDocument
        })
      ]
    }).show();
  },

  showHeader: function() {
    isc.Window.create({
      autoCenter: true,
      width: 800,
      height: 400,
      closeClick: function() {
        this.markForDestroy();
      },
      items: [
        isc.HeaderPanel.create({
          height: "100%",
          width: "100%",
          xmlDocument: this.xmlDocument
        })
      ]
    }).show();
  },

  showNotes: function() {
    isc.Window.create({
      autoCenter: true,
      width: 800,
      height: 400,
      closeClick: function() {
        this.markForDestroy();
      },
      items: [
        isc.NotesPanel.create({
          height: "100%",
          width: "100%",
          xmlDocument: this.xmlDocument
        })
      ]
    }).show();
  },

  showInterpretationsKWIC: function() {
    isc.Window.create({
      autoCenter: true,
      width: 800,
      height: 400,
      closeClick: function() {
        this.markForDestroy();
      },
      items: [
        isc.InterpsKWICPanel.create({
          height: "100%",
          teiDocument: this
        })
      ]
    }).show();
  },

  showDistributionNames: function() {
    isc.Window.create({
      autoCenter: true,
      width: 800,
      height: 400,
      closeClick: function() {
        this.markForDestroy();
      },
      items: [
        isc.DistributionNamesPanel.create({
          height: "100%",
          teiDocument: this
        })
      ]
    }).show();
  },

  showDistributionTitles: function() {
    isc.Window.create({
      autoCenter: true,
      width: 800,
      height: 400,
      closeClick: function() {
        this.markForDestroy();
      },
      items: [
        isc.DistributionTitlesPanel.create({
          height: "100%",
          teiDocument: this
        })
      ]
    }).show();
  },

  showDistributionInterpretations: function() {
    isc.Window.create({
      autoCenter: true,
      width: 800,
      height: 400,
      closeClick: function() {
        this.markForDestroy();
      },
      items: [
        isc.DistributionInterpretationsPanel.create({
          height: "100%",
          teiDocument: this
        })
      ]
    }).show();
  },

  showDistributionEverything: function() {
    isc.Window.create({
      autoCenter: true,
      width: 800,
      height: 400,
      closeClick: function() {
        this.markForDestroy();
      },
      items: [
        isc.DistributionEverythingPanel.create({
          height: "100%",
          teiDocument: this
        })
      ]
    }).show();
  },

  showNamesKWIC: function() {
    isc.Window.create({
      autoCenter: true,
      width: 800,
      height: 400,
      closeClick: function() {
        this.markForDestroy();
      },
      items: [
        isc.NamesKWICPanel.create({
          height: "100%",
          teiDocument: this
        })
      ]
    }).show();
  },

  showNamesDialog: function() {
    isc.Window.create({
      autoCenter: true,
      width: 800,
      height: 400,
      closeClick: function() {
        this.markForDestroy();
      },
      items: [
        isc.NamesDialogPanel.create({
          height: "100%",
          teiDocument: this
        })
      ]
    }).show();
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

isc.defineClass("NamesDialogPanel", isc.HLayout).addProperties({
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

    this.addMembers([
      this.grid,
      this.dialog
    ]);
  }
});

isc.defineClass("GlossaryPanel", isc.XSLTFlow).addProperties({
  xsltName: "glossary"
});

isc.defineClass("HeaderPanel", isc.XSLTFlow).addProperties({
  xsltName: "teiHeader"
});

isc.defineClass("NotesPanel", isc.XSLTFlow).addProperties({
  xsltName: "notes"
});

isc.defineClass("DistributionNamesPanel", isc.HLayout).addProperties({
  teiDocument: null,
  initWidget: function() {
    this.Super("initWidget", arguments);

    this.grid = isc.ListGrid.create();

    this.graph = isc.Label.create({
      defaultValue: "Graph Here"
    });

    this.addMembers([
      this.grid,
      this.graph
    ]);
  }
});

isc.defineClass("IndexKWICPanel", isc.HLayout).addProperties({
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

    this.addMembers([
      this.grid,
      this.kwic
    ]);
  }
});

// This is the analysis panel for names
isc.defineClass("NamesKWICPanel", isc.HLayout).addProperties({
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

    this.addMembers([
      this.grid,
      this.kwic
    ]);
  }
});

isc.defineClass("InterpNamesPanel", isc.HLayout).addProperties({
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

    this.addMembers([
      this.grid,
      this.names
    ]);
  }
});

isc.defineClass("InterpsKWICPanel", isc.HLayout).addProperties({
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

    this.addMembers([
      this.grid,
      this.kwic
    ]);
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

isc.defineClass("TocTreeGrid", isc.TreeGrid).addProperties({
  autoFetchData: true,
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
