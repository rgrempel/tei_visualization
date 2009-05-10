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

    this.documentArea = isc.Canvas.create({
      width: "100%",
      height: "100%"
    });

    this.navigation = isc.VLayout.create({
      width: "100%",
      height: "100%",
      members: [
        isc.Toolbar.create({
          width: "100%",
          buttons: [
            isc.Button.create({
              autoFit: true,
              title: "Show Document List",
              action: function() {
                isc.TEI.app.showDocumentList();
              }
            })
          ]
        }),
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

isc.defineClass("XSLTDocument");
isc.XSLTDocument.addClassProperties({
  urls: {
    projects: "/xslt/projects.xsl",
    main: "/xslt/main.xsl",
    common: "/xslt/common.xsl",
    nameTree: "/xslt/names.xsl",
    interpretationTree: "/xslt/interpretations.xsl",
    nameKwic: "/xslt/names-kwic.xsl",
    nameDialog: "/xslt/names-dialog.xsl",
    interpretationKwic: "/xslt/interpretations-kwic.xsl",
    northPanel: "/xslt/north-panel.xsl",
    tocTree: "/xslt/toc.xsl",
    teiHeader: "/xslt/tei-header.xsl",
    namesCount: "/xslt/names-count.xsl",
    dialogCount: "/xslt/dialog-count.xsl",
    interpretationCount: "/xslt/interpretation-count.xsl",
    everythingCount: "/xslt/everything-count.xsl",
    termList: "/xslt/term-list.xsl",
    indexKwic: "/xslt/index-kwic.xsl",
    glossary: "/xslt/glossary.xsl",
    notes: "/xslt/notes.xsl",
    interpNames: "/xslt/interp-names.xsl",
    interpAllNames: "/xslt/interp-all-names.xsl",
    interpInterpXref: "/xslt/interp-interp-xref.xsl",
    interpNamesProximity: "/xslt/interp-names-proximity.xsl"
  },

  sheets: {},

  loadSheet: function(name, callback) {
    var self = isc.XSLTDocument;
    if (self.sheets[name]) {
      self.fireCallback(callback, "xmlDoc", [self.sheets[name]]);
    } else if (self.urls[name]) {
      isc.XMLTools.loadXML(self.urls[name], function(xmlDoc, xmlText) {
        self.sheets[name] = xmlDoc;
        self.fireCallback(callback, "xmlDoc", [xmlDoc]);
      }, {bypassCache: false});
    }
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
      tocTree: isc.TocTreeDataSource.create()
    });

    this.mainPanel = isc.XSLTFlow.create({
      xsltName: "main",
      width: "*",
      height: "100%",
      showResizeBar: true,
      resizeBarTarget: "next"
    });

    this.tocPanel = isc.TocTreeGrid.create({
      width: 200,
      height: "100%",
      showEdges: true,
      dataSource: this.dataSources.tocTree
    });

    if (this.record) {
      isc.XMLTools.loadXML("/documents/" + this.record.id + ".tei", {target: this, methodName: "loadXMLReply"}, {bypassCache: false});
    }

    this.addItem(
      isc.HLayout.create({
        members: [
          this.mainPanel,
          this.tocPanel
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
  }
});

isc.defineClass("XSLTFlow", isc.Canvas).addProperties({
  xmlDocument: null,
  xsltName: null,
  xsltDocument: null,
  overflow: "auto",

  initWidget: function() {
    this.Super("initWidget", arguments);
    this.reload();
    if (this.xsltName) {
      isc.XSLTDocument.loadSheet(this.xsltName, {target: this, methodName: "setXSLTDocument"});
    }
  },

  setXMLDocument: function(xmlDoc) {
    this.xmlDocument = xmlDoc;
    this.reload();
  },

  setXSLTDocument: function(xsltDoc) {
    this.xsltDocument = xsltDoc;
    this.reload();
  },

  reload: function() {
    if (this.xmlDocument && this.xsltDocument) {
      this.setContents(isc.XMLTools.transformNodes(this.xmlDocument, this.xsltDocument));
    }
  }
});

isc.defineClass("XSLTDataSource","DataSource").addProperties({
  xmlDocument: null,
  xsltDocument: null,
  xsltName: null,
  xsltProcessor: null,
  xmlSerializer: null,
  dataProtocol: "clientCustom",
  dataFormat: "xml",

  init: function() {
    if (this.xsltName) {
      isc.XSLTDocument.loadSheet(this.xsltName, {target: this, methodName: "setXSLTDocument"});
    };
    this.xmlSerializer = new XMLSerializer();
    return this.Super("init", arguments);
  },

  setXSLTDocument: function(doc) {
    this.xsltDocument = doc;
    this.xsltProcessor = new XSLTProcessor();
    this.xsltProcessor.importStylesheet(doc.nativeDoc);
    this.checkRequestQueue();
  },

  setXMLDocument: function(doc) {
    this.xmlDocument = doc;
    this.checkRequestQueue();
  },

  checkRequestQueue: function() {
    if (this.xmlDocument && this.xsltProcessor && this.requestQueue && this.requestQueue.length > 0) {
      var self = this;
      this.requestQueue.map(function (dsRequest) {
        self.delayCall("executeRequest", [dsRequest]);
      });
      delete this.requestQueue;
    }
  },

  transformRequest: function(dsRequest) {
    if (this.xmlDocument && this.xsltProcessor) {
      this.delayCall("executeRequest", [dsRequest]);
    } else {
      if (!this.requestQueue) this.requestQueue = [];
      this.requestQueue.add(dsRequest);
    }
  },

  executeRequest: function(dsRequest) {
    var xmlData = isc.XMLDoc.create(this.xsltProcessor.transformToDocument(this.xmlDocument.nativeDoc));

    // Now, we simulate what a DataSource would ordinarily do ...
    var operationBinding = this.getOperationBinding(dsRequest);
    xmlData.addNamespaces(this.xmlNamespaces);
    xmlData.addNamespaces(operationBinding.xmlNamespaces);

    var xmlNamespaces = isc.addProperties({}, this.xmlNamespaces, operationBinding.xmlNamespaces);

    this.dsResponseFromXML(xmlData, dsRequest, xmlNamespaces, {
      target: this,
      methodName: "_completeHandleXMLReply",
      xmlData: xmlData,
      dsRequest: dsRequest
    });
  },

  _completeHandleXMLReply: function(dsResponse, callback) {
    dsResponse.clientContext = callback.dsRequest.clientContext;
    this.processResponse(callback.dsRequest.requestId, dsResponse);
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
