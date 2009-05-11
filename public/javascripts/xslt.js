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
    if (self.urls[name]) self.loadSheetByURL(self.urls[name], callback);
  },

  loadSheetByURL: function(url, callback) {
    var self = isc.XSLTDocument;
    var existingDoc = self.sheets[url];
    if (existingDoc) {
      if (existingDoc.unmetDependencies.getLength() == 0) {
        self.fireCallback(callback, "xmlDoc", [existingDoc]);
      } else {
        existingDoc.callbackWhenReady.add(callback);
      }
    } else {
      isc.XMLTools.loadXML(url, function(xmlDoc, xmlText) {
        self.sheets[url] = xmlDoc;
        xmlDoc.callbackWhenReady = [callback];
        xmlDoc.loadedFromURL = url;
        xmlDoc.initializeXSLTDependencies();
      }, {bypassCache: false});
    }
  }
});

isc.XMLDoc.addProperties({
  fireCallbackWhenReady: function() {
    var self = this;
    self.callbackWhenReady.map(function(callback) {
      self.fireCallback(callback, "xmlDoc", [self]);
    });
    self.callbackWhenReady = [];
  },

  initializeXSLTDependencies: function() {
    var self = this;

    var dependencyNodes = self.selectNodes("//xsl:include | //xsl:import", {
      xsl: "http://www.w3.org/1999/XSL/Transform"
    });

    this.unmetDependencies = dependencyNodes.map(function(node) {
      return node.getAttribute("href");
    });

    if (this.unmetDependencies.getLength() == 0) {
      this.fireCallbackWhenReady();
    } else {
      this.unmetDependencies.map(function(url) {
        isc.XSLTDocument.loadSheetByURL(url, {
          target: self,
          methodName: "metDependency"
        });
      });
    }
  },

  metDependency: function(xmlDoc) {
    this.unmetDependencies.remove(xmlDoc.loadedFromURL);
    if (this.unmetDependencies.getLength() == 0) this.fireCallbackWhenReady();
  }
});

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

