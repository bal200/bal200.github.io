/******************** CAMPAIGN ****************************************/
var Campaign = Parse.Object.extend("Campaign", {}, { 
  create: function (vendor, comment, card) {
    var campaign = new Campaign();
    campaign.set("vendor", vendor); campaign.set("comment", comment); campaign.set("card", card);
    campaign.set("repeat","");
    campaign.notiType = 1;
    return campaign;
  }
});
Campaign.prototype.__defineGetter__("comment", function() {return this.get("comment");});
Campaign.prototype.__defineSetter__("comment", function(val) {return this.set("comment",val)});
Campaign.prototype.__defineGetter__("repeat", function() {return this.get("repeat");});
Campaign.prototype.__defineSetter__("repeat", function(val) {return this.set("repeat",val)});
Campaign.prototype.__defineGetter__("startDate", function() {
  var d=this.get("startDate");
  //console.log("get date "+d);
  //return ""+d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
  //return "2000-01-01";
  return d;
});
Campaign.prototype.__defineSetter__("startDate", function(val) {
  //console.log("set date "+val);
  this.setOnlyDate( "startDate", val );
});
Campaign.prototype.__defineGetter__("startTime", function() {
  return this.getOnlyTime("startDate");
});
Campaign.prototype.__defineSetter__("startTime", function(val) {
  this.setOnlyTime("startDate", val);
});
Campaign.prototype.__defineGetter__("endDate", function() {return this.get("endDate");});
Campaign.prototype.__defineSetter__("endDate", function(val) { this.setOnlyDate( "endDate", val ); });
Campaign.prototype.__defineGetter__("endTime", function() { return this.getOnlyTime("endDate"); });
Campaign.prototype.__defineSetter__("endTime", function(val) { this.setOnlyTime("endDate", val); });
Campaign.prototype.__defineGetter__("active", function() { return this.get("active"); });
Campaign.prototype.__defineSetter__("active", function(val) { return this.set("active",val) });

Campaign.prototype.__defineGetter__("template", function() { return this.get("template"); });
Campaign.prototype.__defineSetter__("template", function(val) { return this.set("template",val) });

Campaign.prototype.__defineGetter__("templateVariables", function() { return this.get("templateVariables"); });
Campaign.prototype.__defineSetter__("templateVariables", function(val) { return this.set("templateVariables",val) });
Campaign.prototype.__defineGetter__("message", function() { 
  return tvFind(this.templateVariables,"message").value; 
});
Campaign.prototype.__defineSetter__("message", function(val) { 
  var tv = tvFind(this.templateVariables,"message"); 
  tv.value = val;
});
Campaign.prototype.__defineGetter__("title", function() { 
  return tvFind(this.templateVariables,"title").value; 
});
Campaign.prototype.__defineSetter__("title", function(val) { 
  var tv = tvFind(this.templateVariables,"title"); 
  tv.value = val;
});

Campaign.prototype.__defineGetter__("picture", function() { 
  return tvFind(this.templateVariables,"picture").value; 
});
Campaign.prototype.__defineSetter__("picture", function(val) { 
  var tv = tvFind(this.templateVariables,"picture"); 
  tv.value = val;
});

function tvFind(tv, search) {
  if(Array.isArray(tv)) {
    for (var n=0; n<tv.length; n++) {
      if (tv[n].name == search) return tv[n];
    }
  } else {
    return '';
  }
}


Campaign.prototype.__defineGetter__("notiText", function() {return this.get("notiText");});
Campaign.prototype.__defineSetter__("notiText", function(val) {return this.set("notiText",val)});
Campaign.prototype.__defineGetter__("notiStatus", function() {return this.get("notiStatus");});
Campaign.prototype.__defineSetter__("notiStatus", function(val) {return this.set("notiStatus",val)});
Campaign.prototype.__defineGetter__("notiOn", function() {
  //console.log(this.get("comment")+" campaign Get notiOn:"+ this.get("notiStatus"));
  if (this.get("notiStatus").toLowerCase()=="wait") return true;
  if (this.get("notiStatus").substring(0,4).toLowerCase()=="sent") return true;
  return false;
});
Campaign.prototype.__defineSetter__("notiOn", function(val) {
  //console.log(this.get("comment")+" campaign Set notiOn: "+val );
  if (val==true) 
    { this.set("notiStatus","wait"); }
  else
    { this.set("notiStatus","off"); }
  //return false;
});
Campaign.prototype.setOnlyDate = function(parseColumn, dateStr) {
  var nw = new Date(dateStr);
  var d=this.get(parseColumn);
  if (!d) { this.setOnlyTime(parseColumn, (parseColumn=="startDate" ? '800' : '1700') ); d=this.get(parseColumn); }
  d.setFullYear(nw.getFullYear(), nw.getMonth(), nw.getDate());
  this.set(parseColumn, d);
}
Campaign.prototype.setOnlyTime = function(parseColumn, timeStr) {
  var d=this.get(parseColumn);
  if (!d) d=new Date();
  var hours = timeStr.substr(0, 2 );
  var mins = timeStr.substr(-2, 2);
  d.setHours(hours, mins, 00, 0);
  this.set(parseColumn, d);
}
Campaign.prototype.getOnlyTime = function(parseColumn) {
  var d=this.get(parseColumn);
  if (d) {
    return zeroPad(d.getHours())+":"+zeroPad(d.getMinutes());
  }else{
    return "";
  }
}
function zeroPad(n) { return (n<10 ? "0"+n : ""+n) }


/* init default template Variables for a brand new Campaign from a CardTemplate */
Campaign.prototype.defaultTemplateVariables = function( cardTemplate ) {
  var to = this.get('templateVariables');
  var from = cardTemplate.get('variables');
  if (!to) to = [];

  for (n=0; n<from.length; n++) {
    var newName = from[n].name;
    var found=false;
    for (m=0; m<to.length; m++) {
      if (to[m].name == newName) {found=true; break;}
    }
    if (found==false) to.push( {
      name: newName,
      type: from[n].type,
      value: ""
    } );
  }
  this.set('templateVariables', to);
}

