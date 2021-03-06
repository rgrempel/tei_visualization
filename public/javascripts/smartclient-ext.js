// A shim to Bluff for charting
isc.defineClass("BluffChart", isc.Canvas).addProperties({
  redrawOnResize: true,
  overflow: "hidden",
  theme: "theme_keynote",

  initWidget: function() {
    this.Super("initWidget", arguments);
  },

  getCanvasID: function() {
    return this.getID() + "_canvas";
  },

  getInnerHTML: function() {
    return '<canvas id="' + this.getCanvasID() + '"></canvas>';
  },

  draw: function() {
    this.Super("draw", arguments);
    this.drawGraph();
    return this;
  },

  redraw: function() {
    this.Super("redraw", arguments);
    this.drawGraph();
    return this;
  },

  drawGraph: function() {
    var self = this;
    var g = this.graph = new Bluff.Line(this.getCanvasID(), String(this.getInnerWidth()) + 'x' + String(this.getInnerHeight()));

    g[this.theme]();
    g.title = this.title;

    var rowTitleFieldName = this.facets.getLength() > 1 ? this.facets[1].id : this.labelField;
    var dataFields = this.facets[0].values;
    this.data.map(function(row) {
      g.data(row[rowTitleFieldName], dataFields.map(function(field) {
        return row[field.name];
      }));
    });

    var index = 0;
    var labels = {};
    dataFields.map(function(field) {
      labels[index++] = field.title || field.name;
    });
    g.labels = labels;

    this.graph.draw();
  }
});

// A convenience method to selectNodes relative to a Canvas
isc.Canvas.addProperties({
  selectNodes: function(xpath, namespaces) {
    return isc.XMLTools.selectNodes(this.getHandle(), xpath, namespaces) || [];
  },

  scrollToID: function(id, callback) {
    var element = this.selectNodes("descendant::*[@id='" + id + "']").get(0);
    if (element) this.scrollToElement(element, callback);
  },

  scrollToElement: function(element, callback) {
    if (element.nodeType != 1 || !element.offsetWidth) {
      // It's probably hidden ... try scrolling the previousSiblling, or the parent
      if (element.previousSibling) {
        this.scrollToElement(element.previousSibling);
      } else if (element.parentNode) {
        this.scrollToElement(element.parentNode);
      }
      return;
    }

    var scrollTo = isc.Element.getOffsetTop(element);

    this.animateScroll(0, scrollTo, function(){
      isc.Element.yellowFade(element);
      if (callback) this.fireCallback(callback);
    });
  },
});

// A convenience method to find the first ancestor of a nativeTarget that
// matches the supplied xpath.
isc.EventHandler.addClassProperties({
  findTarget: function(xpath, namespaces, ev) {
    if (!ev) ev = isc.EventHandler.lastEvent;
    if (!ev) return null;
    if (!ev.nativeTarget) return null;

    var nodes = isc.XMLTools.selectNodes(ev.nativeTarget, xpath, namespaces);
    if (nodes.getLength() > 0) {
      return nodes.get(0);
    } else {
      return null;
    }
  }
});

// Performs a yellow background highlight which then fades.
// Element is the element to fade ... required
// Color is the highlight color ... defaults to yellow
// Callback is called back at end ... optional
// Duration and acceleration are passed to the animation code ... optional

isc.Element.addClassProperties({
  yellowFade: function(element, color, callback, duration, acceleration) {
    if (!color) color = "#CCCC00";
    if (!duration) duration = 2000;

    // This is the backgroundColor style to restore when we're all done
    var restoreColor = element.style.backgroundColor;

    // This is supposed to be the actual visible color, but it's not working
    var visibleColor = isc.Element.getComputedStyleAttribute(element, "backgroundColor");
    if (visibleColor == "") visibleColor = "#FFFFFF";

    var originalRGB = isc.ColorUtils.htmlToRgb(visibleColor);
    var highlightRGB = isc.ColorUtils.htmlToRgb(color);
    var delta = {
      r: originalRGB.r - highlightRGB.r,
      g: originalRGB.g - highlightRGB.g,
      b: originalRGB.b - highlightRGB.b
    };

    element.style.backgroundColor = color;

    isc.Animation.registerAnimation(function(ratio, ID, earlyFinish) {
      if (earlyFinish || ratio == 1) {
        element.style.backgroundColor = restoreColor;
        if (callback) isc.Element.fireCallback(callback);
      } else {
        var transition = {
          r: Math.floor(highlightRGB.r + delta.r * ratio),
          g: Math.floor(highlightRGB.g + delta.g * ratio),
          b: Math.floor(highlightRGB.b + delta.b * ratio)
        };
        element.style.backgroundColor = isc.ColorUtils.rgbToHtml(transition.r, transition.g, transition.b);
      }
    }, duration, acceleration);
  }
});

// This is a DyanmicForm customized to cope with file uploads.

isc.defineClass("FileUploadForm", "DynamicForm").addProperties({
  encoding: "multipart",

  saveFileData: function(callback, requestProperties) {
    if (!this.validate()) return false;
    isc.UploadProgressWindow.create({
      form: this,
      callback: callback,
      requestProperties: requestProperties
    }).show();
  },

  setTarget: function(target) {
    this.target = target;
    var form = this.getForm();
    if (form) form.target = target;
  }
});

isc.defineClass("UploadProgressWindow", "Window").addProperties({
  title: "Upload Progress",
  autoCenter: true,
  width: 300,
  height: 150,
  showCloseButton: false,
  showFooter: false,
  xProgressID: null,
  form: null,
  callback: null,
  data: {
    state: "starting"
  },

  initWidget: function() {
    this.Super("initWidget", arguments);

    if (!this.form.originalAction) this.form.originalAction = this.form.action;
    if (!this.requestProperties) this.requestProperties = {};

    this.xProgressID = String (new Date().getTime() * Math.random());
    var connector = (this.form.originalAction.indexOf('?') >= 0) ? "&" : "?";
    this.form.setAction(this.form.originalAction + connector + "X-Progress-ID=" + this.xProgressID +
        "&callback=top['" + this.getID() + "']._saveFileDataCallback");

    this.target = this.getID() + "_callbackIframe";
    this.form.setTarget (this.target);
    this.addItem(isc.Canvas.create({
      height: 10,
      width: 10,
      contents: "<iframe style='position: absolute; visibility: hidden; top: -1000px;' name='" + this.target + "'></iframe>"
    }));
  },

  show: function() {
    this.Super("show", arguments);
    if (!this.shown) {
      this.shown = true;

      // Now, we're going to call into the saveData() code path on the DynamicForm.
      // But, we want to use a custom way of contacting the server ... via a form submission to our hidden iframe,
      // with the JSONP callback. So, we specify a "clientCustom" protocal on the request ... this allows SC to
      // set everything up the way it expects, and then lets us do the actual communication
      // The way we implement our protocol is through transformRequest on the DataSource. Since JavaScript is
      // non-threaded, and we won't be async until after transformRequest, we can do some magic here ...
      var ds = isc.DataSource.get(this.form.dataSource);
      var progressTracker = this;

      var bindings = {
        add: ds.getOperationBinding("add"),
        update: ds.getOperationBinding("update")
      };

      var oldProtocols = {
        add: bindings.add.dataProtocol,
        update: bindings.update.dataProtocol
      };

      bindings.add.dataProtocol = "clientCustom";
      bindings.update.dataProtocol = "clientCustom";

      var oldDataFormat = ds.dataFormat;

      // We save the current transformRequest method on the dataSource, and substitute (temporarily) a version that
      // does what we want ...
      var oldTransformRequest = ds.transformRequest;
      ds.transformRequest = function(dsRequest) {
        // We inject the requestId into the parent context so that we'll have it for the callback ... isn't Javascript fun?
        progressTracker.requestId = dsRequest.requestId;
        // Then, we just get the form to submit itself in the usual way ...
        progressTracker.form.submitForm();
      }

      // Now, this is what actually triggers the code we just wrote ...
      this.form.saveData(this.callback, this.requestProperties);

      // And now we undo the magic
      ds.transformRequest = oldTransformRequest;
      bindings.add.dataProtocol = oldProtocols.add;
      bindings.update.dataProtocol = oldProtocols.update;

      this.delayCall("initProgress");
    }
  },

  _saveFileDataCallback: function(response) {
    if (this.timedUpdate) {
      isc.Timer.clear(this.timedUpdate);
      this.timedUpdate = null;
    }

    // Now we tell the dataSource to get snappy
    var ds = isc.DataSource.get(this.form.dataSource);
    var oldTransformResponse = ds.transformResponse;
    // the response is fine ... just return it
    ds.transformResponse = function(dsResponse, dsRequest, data) {
      return dsResponse;
    };

    ds.processResponse(this.requestId, response.response);

    ds.transformResponse = oldTransformResponse;

    this.markForDestroy();
  },

  initProgress: function(){
    this.progressRS = isc.ResultSet.create({
      dataSource: "uploadprogress",
      criteria: {
        "X-Progress-ID": this.xProgressID
      },
      progressWindow: this,
      dataArrived: function(startRow, endRow) {
        this.progressWindow.handleDataArrived(startRow, endRow);
      }
    });

    this.progressbar = isc.Progressbar.create({
      top: 10,
      height: 20
    });
    this.addItem(this.progressbar);

    this.updateProgress();
  },

  updateProgress: function() {
    this.timedUpdate = null;
    if (this.data.state == "starting" || this.data.state == "uploading") {
      this.progressRS.invalidateCache();
      this.progressRS.get(0);
    }
  },

  handleDataArrived: function(startRow, endRow) {
    if (startRow == 0 && endRow >= 0) {
      this.data = this.progressRS.get(0);
      if (this.data.state == "uploading") {
        this.progressbar.setPercentDone(this.data.received * 100 / this.data.size);
      } else if (this.data.state == "starting") {
        this.progressbar.setPercentDone(0);
      } else {
        return;
      }
      this.timedUpdate = this.delayCall("updateProgress", [], 2000);
    }
  }
});

isc.XJSONDataSource.create({
  ID: "uploadprogress",
  dataURL: "/uploadprogress",
  recordXPath: "/",
  callbackParam: "callback",
  showPrompt: false,
  fields: [
    {name: "state", type: "text"},
    {name: "received", type: "integer"},
    {name: "size", type: "integer"},
    {name: "speed", type: "integer"}
  ]
});

// This is a button that, by default, starts editing a new
// row in a grid. You pass in the grid as a "target" property.

isc.defineClass("GridButtonNew", "Button").addProperties({
  title: "New",
  target: null,
  action: function() {
    if (!this.target) return;
    this.target.doNew();
  },
  setTarget: function(grid) {
    this.target = grid;
  }
});

// This is a button that does a "delete" action on selected
// items in a grid.

isc.defineClass("GridButtonDelete", "Button").addProperties({
  title: "Delete",
  target: null,
  action: function() {
    if (!this.target) return;
    this.target.doDeleteSelection();
  },
  setTarget: function(grid) {
    if (this.target) this.ignore(this.target, "selectionChanged");
    this.target = grid;
    if (this.target) this.observe(this.target, "selectionChanged", "observer.handleSelectionChanged()");
  },
  initWidget: function() {
    this.Super("initWidget", arguments);
    if (this.target) this.setTarget(this.target);
  },
  handleSelectionChanged: function() {
    this.setDisabled(!this.target.anySelected());
  }
});

// This is a button that does an "open" action on selected
// items in a grid.

isc.defineClass("GridButtonOpen", "Button").addProperties({
  title: "Open",
  target: null,
  action: function() {
    if (!this.target) return;
    this.target.doOpenSelection();
  },
  setTarget: function(grid) {
    if (this.target) this.ignore(this.target, "selectionChanged");
    this.target = grid;
    if (this.target) this.observe(this.target, "selectionChanged", "observer.handleSelectionChanged()");
  },
  initWidget: function() {
    this.Super("initWidget", arguments);
    if (this.target) this.setTarget(this.target);
  },
  handleSelectionChanged: function() {
    this.setDisabled(!this.target.anySelected());
  }
});

// The RailsDataSource is adapted from code found in the SmartClient forums ...
// see http://forums.smartclient.com/showthread.php?t=3031

isc.defineClass("RailsDataSource", "RestDataSource");

isc.RailsDataSource.addProperties({
    operationBindings:[
       {operationType:"fetch", dataProtocol:"getParams"},
       {operationType:"add", dataProtocol:"postMessage"},
       {operationType:"remove", dataProtocol:"postParams", requestProperties:{httpMethod:"DELETE"}},
       {operationType:"update", dataProtocol:"postMessage", requestProperties:{httpMethod:"PUT"}}
    ],

    getDataURL : function (dsRequest) {
        var url = this.Super("getDataURL", arguments);
        switch (dsRequest.operationType) {
          case "fetch":
          case "add":
            url += ".sc";
            break;
          case "remove":
          case "update":
            url += "/{id}.sc";
            break;
        }
        for (var key in dsRequest.data) {
          macro = "{" + key + "}";
          while (url.indexOf(macro) >= 0) {
            url = url.replace(macro, escape(dsRequest.data[key]));
          }
        }
        return url;
    }
});

isc.DataSource.addClassMethods({

  // loadSchema - attempt to load a remote dataSource schema from the server.
  // This is supported as part of the SmartClient server functionality
  // This is based on code from David Johnson ...
  // see http://smartclientexperience.blogspot.com/2008/10/datasource-dependencies.html

  loadSchema: function(name, callback, context) {
    var ds = isc.DataSource.getDataSource(name);
    if (ds) {
      context.fireCallback(callback, "ds", [ds], context);
      return null;
    }

    isc.RPCManager.sendRequest({
      evalResult: true,
      useSimpleHttp: true,
      httpMethod: "GET",
      actionURL: "/" + name + "/schema.scjs",
      callback: this._loadSchemaComplete,
      clientContext: {
        dataSource: name,
        callback: callback,
        context: context
      }
    });

    return null;
  },

  _loadSchemaComplete: function(rpcResponse, data, rpcRequest) {
    var clientContext = rpcResponse.clientContext
    var name = clientContext.dataSource;
    var callback = clientContext.callback;
    var context = clientContext.context;

    // Now that the dataSource is loaded, we can leverage the DataSource.getDataSource()
    // method to make the callback.
    var ds = isc.DataSource.getDataSource(name);
    context.fireCallback(callback, "ds", [ds], context);
  }
});
