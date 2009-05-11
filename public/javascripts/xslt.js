isc.setAutoDraw(false);

isc.defineClass("XSLTDocument");
isc.XSLTDocument.addClassProperties({
  urls: {
    projects: "/xslt/projects.xsl",
    main: "/xslt/main.xsl",
    common: "/xslt/common.xsl",
    names: "/xslt/names.xsl",
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

isc.XSLTDocument.loadSheet("common");

isc.defineClass("XSLTFlow", isc.Canvas).addProperties({
  xmlDocument: null,
  xsltName: null,
  xsltDocument: null,
  xsltProcessor: null,
  overflow: "auto",
  xmlSerializer: new XMLSerializer(),

  initWidget: function() {
    this.Super("initWidget", arguments);
    this.params = {};
    this.reload();
    if (this.xsltName) {
      isc.XSLTDocument.loadSheet(this.xsltName, {target: this, methodName: "setXSLTDocument"});
    }
  },

  setXMLDocument: function(xmlDoc) {
    this.xmlDocument = xmlDoc;
    this.delayCall("reload");
  },

  setXSLTDocument: function(xsltDoc) {
    this.xsltDocument = xsltDoc;
    this.xsltProcessor = new XSLTProcessor();
    this.xsltProcessor.importStylesheet(this.xsltDocument.nativeDoc);

    this.delayCall("reload");
  },

  setParams: function(params) {
    this.params = params || {};
    this.reload();
  },

  reload: function() {
    if (this.xmlDocument && this.xsltDocument) {
      var self = this;
      this.xsltProcessor.clearParameters();
      isc.getKeys(this.params).map(function(key) {
        self.xsltProcessor.setParameter(null, key, self.params[key]);
      });
      var xmlData = isc.XMLDoc.create(this.xsltProcessor.transformToDocument(this.xmlDocument.nativeDoc));
      var contents = this.xmlSerializer.serializeToString(xmlData.nativeDoc);
      this.setContents(contents);
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

