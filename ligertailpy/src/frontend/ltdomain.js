function setLigertailDomain() {
    if (!window.ligertail) {
        window.ligertail = {};
    }
    var hostname = window.document.location.hostname;
    if (hostname == 'ligertail.com' || hostname == 'www.ligertail.com') {
      hostname = 'ligertailbackend.appspot.com';
      window.ligertail.visibleDomain = 'ligertail.com';
    }
    var domain = window.document.location.protocol + "//" + hostname;
    if (window.document.location.port) {
      domain += ":" + window.document.location.port;
    }
    window.ligertail.domain = domain;
  }; 

setLigertailDomain();
