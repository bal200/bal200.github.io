/*********************** CARD *****************************************/
var Card = Parse.Object.extend("Card", { },{ 
  create: function (vendor, title, order) {
    var card = new Card();
    card.set("vendor", vendor); card.set("title", title); card.set("order", order);
    card.set("active", false); 
    return card;
  }
});
Card.prototype.__defineGetter__("title", function() {return this.get("title");});
Card.prototype.__defineSetter__("title", function(val) {return this.set("title",val)});
Card.prototype.__defineGetter__("html", function() {return this.get("html");});
Card.prototype.__defineSetter__("html", function(val) {return this.set("html",val)});
Card.prototype.__defineGetter__("active", function() {return this.get("active");});
Card.prototype.__defineSetter__("active", function(val) {return this.set("active",val)});
Card.prototype.__defineGetter__("order", function() {return this.get("order");});
Card.prototype.__defineSetter__("order", function(val) {return this.set("order",val)});

Card.prototype.__defineGetter__("type", function() {
  if (this.campaign) {
    if (this.campaign.template) return "templated";
    else return "simple";
  }else
    return "simple"; 
});
//Card.prototype.__defineSetter__("type", function(val) {console.log("@TODO: custom/simple cards")});

//Card.prototype.__defineGetter__("picture", function() {return this.get("picture");});
//Card.prototype.__defineSetter__("picture", function(val) {return this.set("picture",val)});

Card.prototype.__defineGetter__("schedulerOn", function() {
  if (!this.campaign) { return false; }
  else { return this.campaign.get("active"); }
});
Card.prototype.__defineSetter__("schedulerOn", function(val) {
  if (!this.campaign) {
    this.campaign = Campaign.create(this.get("vendor"), this.get("title"), this);
    this.campaign.notiOn = false;
  }
  this.campaign.set("active",val);
  if (val==false) { this.campaign.notiOn = false; }
});

Card.prototype.__defineGetter__("title2", function() {return this.get("title");});
Card.prototype.__defineSetter__("title2", function(val) {
  this.set("title",val);
  if (this.campaign) this.campaign.title = val;
});

/* If the Campaign has a Template, move its variable Values to the card, where the form can edit them */
Card.prototype.unpackTemplateVariable = function() {
  if (this.campaign && this.campaign.templateVariables) {
    this.templateVariables = copyTemplateVars( this.campaign.templateVariables );
    //this.templateVariables = this.campaign.templateVariables;
  }
}
function unpackTemplateVariables(cards) {  
  cards.forEach(function(c) { c.unpackTemplateVariable() });
}

/* initialise a new template just added to a card */
Card.prototype.initTemplate = function( callback ) {
  var campaign = this.campaign;
  var template = campaign.get("template");
  template.fetch({
    success: function(tmpl) {
        campaign.defaultTemplateVariables( tmpl );
        this.unpackTemplateVariable( );
        callback();
    }.bind(this)
  });
}

/* take the template and Campaign Variables and create the card HTML, overwriting it */
Card.prototype.compileTemplate = function(cardTemplate, variables) {
  return new Promise((resolve, reject) => {
    var replacements = {};
    console.log('compiling template');
    for (n=0; n<variables.length; n++) {
      // Convert image structure in to an embedded image string
      //if (variables[n].name == 'picture' && variables[n].value.filesize > 0) {
      //  variables[n].value = 'data:' + variables[n].value.filetype + ';base64,' + variables[n].value.base64;
      //} 
      //if (variables[n].type == 'file') {
      //  replacements[ variables[n].name ] = 'data:' + variables[n].value.filetype + ';base64,' + variables[n].value.base64;
      //} else {
        replacements[ variables[n].name ] = variables[n].value;
      //}
      // Make variables available in card template
      //this.campaign[variables[n].name] = variables[n].value;
    }
    var vendor = this.get("vendor");
    replacements['vendorid'] = vendor.id;
    vendor.fetch({
      success: function(vend) {
        replacements['vendor'] = vend.get("businessName");
        
        cardTemplate.fetch({
          success: function(ctemplate) {
              /* Use lodash template function to create the card html*/
              _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
              var compiled = _.template( ctemplate.get('html') );
              var html = compiled( replacements );
              resolve( html );
          },
          error: function(e) {reject(e)}
        });

      }
    });
  });


}


/***** Helper functions for Cards and Templates *************/

function copyTemplateVars( from ) {
  var to = [];
  for (var m=0; m<from.length; m++) {
    to[m] = { name: from[m].name,
              type: from[m].type,
              value: (from[m].value ? from[m].value : "") };
  }
  return to;
}

function linkCardsToCampaigns(cards, campaigns) {
  for (var n=0; n<campaigns.length; n++) {
    for (var m=0; m<cards.length; m++) {
      if (campaigns[n].get('card').id == cards[m].id) {
        cards[m].campaign = campaigns[n];
} } } }
