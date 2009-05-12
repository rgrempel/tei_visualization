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
  dataSources: {},
  maximized: true,
  keepInParentRect: true,
  showMaximizeButton: true,

  initWidget: function(){
    this.Super("initWidget", arguments);

    this.setTitle(this.record.title);

    isc.addProperties(this.dataSources, {
      tocTree: isc.TocTreeDataSource.create(),
      names: isc.NamesDataSource.create()
    });

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

isc.defineClass("TocTreeDataSource", "XSLTDataSource").addProperties({
  xsltName: "tocTree",
  recordXPath: "/default:toc/default:tocentry",
  fields: [
    {name: "text", type: "text", title: "Title"},
    {name: "id", type: "text", title: "ID"},
    {name: "n", type: "text", title: "n"},
    {name: "children", childrenField: true}
  ]
});

isc.defineClass("TocTreeGrid", isc.TreeGrid).addProperties({
  autoFetchData: true,
  loadDataOnDemand: false,
  fields: [
    {name: "text", treeField: true}
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
