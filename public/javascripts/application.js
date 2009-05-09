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
        })
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
      this.navigation.removeMember(this.teiDocument);
      this.teiDocument.markForDestroy();
    }
    this.teiDocument = isc.TEIDocument.create({
      record: doc
    });
    if (this.teiDocument) this.navigation.addMember(this.teiDocument);
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

isc.defineClass("TEIDocument", isc.VLayout).addProperties({
  record: null,
  xmlDocument: null,

  initWidget: function(){
    this.Super("initWidget", arguments);

    this.mainPanel = isc.XSLTFlow.create({
      xsltName: "main",
      width: "100%",
      height: "100%"
    });

    if (this.record) {
      isc.XMLTools.loadXML("/documents/" + this.record.id + ".tei", {target: this, methodName: "loadXMLReply"}, {bypassCache: false});
    }

    this.addMember(this.mainPanel);
  },

  loadXMLReply: function(xmlDoc, xmlText) {
    this.xmlDocument = xmlDoc;
    this.mainPanel.setXMLDocument(xmlDoc);
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
