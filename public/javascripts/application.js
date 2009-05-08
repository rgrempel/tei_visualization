isc.setAutoDraw(false);

isc.defineClass("TEI");

isc.TEI.addClassProperties({
  app: null
});

isc.TEI.addProperties({
  init: function () {
    this.Super("init", arguments);

    isc.TEI.app = this;

    this.list = isc.DocumentList.create({
      align: "center",
      width: "100%",
      height: "100%"
    });
  },

  draw: function() {
    this.list.draw();
  },

  newDocumentWindow: null,

  doNewDocument: function() {
    if (!this.newDocumentWindow) {
      this.newDocumentWindow = isc.NewDocumentWindow.create();
    }
    this.newDocumentWindow.show();
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
}, Page.FIRE_ONCE);
