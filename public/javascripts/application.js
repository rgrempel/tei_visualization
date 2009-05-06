isc.setAutoDraw(false);

isc.defineClass("TEI");

isc.TEI.addClassProperties({
  app: null
});

isc.TEI.addProperties({
  init: function () {
    this.Super("init", arguments);

    isc.TEI.app = this;

    this.label = isc.Label.create({
      align: "center",
      contents: "Hello World"
    });
  },

  draw: function() {
    this.label.draw();
  }
});

isc.Page.setEvent("load", function() {
  var app = isc.TEI.create();
  app.draw();
}, Page.FIRE_ONCE);
