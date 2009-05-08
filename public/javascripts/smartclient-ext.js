// This is a DyanmicForm customized to cope with file uploads.

isc.defineClass("FileUploadForm", "DynamicForm").addProperties({
  encoding: "multipart",
  canSubmit: true,
  initWidget: function() {
    this.xProgressID = String (new Date().getTime() * Math.random());
    this.originalAction = this.action;
    var connector = (this.originalAction.indexOf('?') >= 0) ? "&" : "?";
    this.action = this.originalAction + connector + "X-Progress-ID=" + this.xProgressID +
        "&jsonp=top.window['" + this.getID() + "']._saveFileDataCallback"
    this.Super("initWidget", arguments);
  },
  saveFileData: function(callback) {
    if (!this.validate()) return false;
    this.submitForm();
    this.delayCall("showProgressWindow");
  },
  _saveFileDataCallback: function(dsResponse) {
    isc.say("hi");
    if (this.progressWindow) this.progressWindow.hide();
  },
  showProgressWindow: function() {
    if (!this.progressWindow) this.progressWindow = isc.UploadProgressWindow.create({
      xProgressID: this.xProgressID
    });
    this.progressWindow.show();
  },
  getInnerHTML: function() {
    this.target = this.getID() + "_callbackIframe";
    var iframe = "<iframe style='position: absolute; visibility: hidden; top: -1000px' " +
                 "name='" + this.target + "'></iframe>";
    return this.Super("getInnerHTML", arguments) + iframe;
  }
});

isc.defineClass("UploadProgressWindow", "Window").addProperties({
  title: "Upload Progress",
  autoCenter: true,
  width: 300,
  height: 150,
  initWidget: function() {
    this.Super("initWidget", arguments);

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
    if (!this.data || this.data.state == "starting" || this.data.state == "uploading") {
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
      this.delayCall("updateProgress", [], 2000);
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
