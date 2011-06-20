/*
 * Facebox (for jQuery)
 * version: 1.2 (05/05/2008)
 * @requires jQuery v1.2 or later
 *
 * Examples at http://famspam.comfacebox/
 *
 * Licensed under the MIT:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright 2007, 2008 Chris Wanstrath [ chris@ozmm.org ]
 *
 * Usage:
 *  
 *  jQuery(document).ready(function() {
 *    jQuery('a[rel*=facebox]').facebox() 
 *  })
 *
 *  <a href="#terms" rel="facebox">Terms</a>
 *    Loads the #terms div in the box
 *
 *  <a href="terms.html" rel="facebox">Terms</a>
 *    Loads the terms.html page in the box
 *
 *  <a href="terms.png" rel="facebox">Terms</a>
 *    Loads the terms.png image in the box
 *
 *
 *  You can also use it programmatically:
 * 
 *    jQuery.facebox('some html')
 *
 *  The above will open a facebox with "some html" as the content.
 *    
 *    jQuery.facebox(function($) { 
 *      $.get('blah.html', function(data) { $.facebox(data) })
 *    })
 *
 *  The above will show a loading screen before the passed function is called,
 *  allowing for a better ajaxy experience.
 *
 *  The facebox function can also display an ajax page or image:
 *  
 *    jQuery.facebox({ ajax: 'remote.html' })
 *    jQuery.facebox({ image: 'dude.jpg' })
 *
 *  Want to close the facebox?  Trigger the 'close.facebox' document event:
 *
 *    jQuery(document).trigger('close.facebox')
 *
 *  Facebox also has a bunch of other hooks:
 *
 *    loading.facebox
 *    beforeReveal.facebox
 *    reveal.facebox (aliased as 'afterReveal.facebox')
 *    init.facebox
 *
 *  Simply bind a function to any of these hooks:
 *
 *   $(document).bind('reveal.facebox', function() { ...stuff to do after the facebox and contents are revealed... })
 *
 */
(function(jq14) {
  jq14.facebox = function(data, klass) {
    jq14.facebox.loading()

    if (data.ajax) fillFaceboxFromAjax(data.ajax)
    else if (data.image) fillFaceboxFromImage(data.image)
    else if (data.div) fillFaceboxFromHref(data.div)
    else if (jq14.isFunction(data)) data.call(jq14)
    else jq14.facebox.reveal(data, klass)
  }

  /*
   * Public, $.facebox methods
   */

  jq14.extend(jq14.facebox, {
    settings: {
      opacity      : 0.4,
      overlay      : true,
      loadingImage : 'http://ligertailbackend.appspot.com/frontend/facebox/loading.gif',
      closeImage   : 'http://ligertailbackend.appspot.com/frontend/facebox/closelabel.gif',
      imageTypes   : [ 'png', 'jpg', 'jpeg', 'gif' ],
      faceboxHtml  : '\
    <div id="facebox" style="display:none;"> \
      <div class="popup"> \
        <table> \
          <tbody> \
            <tr> \
              <td class="tl"/><td class="b"/><td class="tr"/> \
            </tr> \
            <tr> \
              <td class="b"/> \
              <td class="body"> \
                <div class="lightbox_content"> \
                </div> \
                <div class="footer"> \
                  <a href="#" class="close"> \
                    <img src="http://ligertailbackend.appspot.com/frontend/facebox/closelabel.gif" title="close" class="close_image" /> \
                  </a> \
                </div> \
              </td> \
              <td class="b"/> \
            </tr> \
            <tr> \
              <td class="bl"/><td class="b"/><td class="br"/> \
            </tr> \
          </tbody> \
        </table> \
      </div> \
    </div>'
    },

    loading: function() {
      init()
      if (jq14('#facebox .loading').length == 1) return true
      showOverlay()

      jq14('#facebox .lightbox_content').empty()
      jq14('#facebox .body').children().hide().end().
        append('<div class="loading"><img src="'+jq14.facebox.settings.loadingImage+'"/></div>')

      jq14('#facebox').css({
        top:	getPageScroll()[1] + (getPageHeight() / 10),
        left:	385.5
      }).show()

      jq14(document).bind('keydown.facebox', function(e) {
        if (e.keyCode == 27) jq14.facebox.close()
        return true
      })
      jq14(document).trigger('loading.facebox')
    },

    reveal: function(data, klass) {
      jq14(document).trigger('beforeReveal.facebox')
      if (klass) jq14('#facebox .lightbox_content').addClass(klass)
      jq14('#facebox .lightbox_content').append(data)
      jq14('#facebox .loading').remove()
      jq14('#facebox .body').children().fadeIn('normal')
      jq14('#facebox').css('left', jq14(window).width() / 2 - (jq14('#facebox table').width() / 2))
      jq14(document).trigger('reveal.facebox').trigger('afterReveal.facebox')
    },

    close: function() {
      jq14(document).trigger('close.facebox')
      return false
    }
  })

  /*
   * Public, $.fn methods
   */

  jq14.fn.facebox = function(settings) {
    init(settings)

    function clickHandler() {
      jq14.facebox.loading(true)

      // support for rel="facebox.inline_popup" syntax, to add a class
      // also supports deprecated "facebox[.inline_popup]" syntax
      var klass = this.rel.match(/facebox\[?\.(\w+)\]?/)
      if (klass) klass = klass[1]

      fillFaceboxFromHref(this.href, klass)
      return false
    }

    return this.click(clickHandler)
  }

  /*
   * Private methods
   */

  // called one time to setup facebox on this page
  function init(settings) {
    if (jq14.facebox.settings.inited) return true
    else jq14.facebox.settings.inited = true

    jq14(document).trigger('init.facebox')
    makeCompatible()

    var imageTypes = jq14.facebox.settings.imageTypes.join('|')
    jq14.facebox.settings.imageTypesRegexp = new RegExp('\.' + imageTypes + 'jq14', 'i')

    if (settings) jq14.extend(jq14.facebox.settings, settings)
    jq14('body').append(jq14.facebox.settings.faceboxHtml)

    var preload = [ new Image(), new Image() ]
    preload[0].src = jq14.facebox.settings.closeImage
    preload[1].src = jq14.facebox.settings.loadingImage

    jq14('#facebox').find('.b:first, .bl, .br, .tl, .tr').each(function() {
      preload.push(new Image())
      preload.slice(-1).src = jq14(this).css('background-image').replace(/url\((.+)\)/, '$1')
    })

    jq14('#facebox .close').click(jq14.facebox.close)
    jq14('#facebox .close_image').attr('src', jq14.facebox.settings.closeImage)
  }
  
  // getPageScroll() by quirksmode.com
  function getPageScroll() {
    var xScroll, yScroll;
    if (self.pageYOffset) {
      yScroll = self.pageYOffset;
      xScroll = self.pageXOffset;
    } else if (document.documentElement && document.documentElement.scrollTop) {	 // Explorer 6 Strict
      yScroll = document.documentElement.scrollTop;
      xScroll = document.documentElement.scrollLeft;
    } else if (document.body) {// all other Explorers
      yScroll = document.body.scrollTop;
      xScroll = document.body.scrollLeft;	
    }
    return new Array(xScroll,yScroll) 
  }

  // Adapted from getPageSize() by quirksmode.com
  function getPageHeight() {
    var windowHeight
    if (self.innerHeight) {	// all except Explorer
      windowHeight = self.innerHeight;
    } else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode
      windowHeight = document.documentElement.clientHeight;
    } else if (document.body) { // other Explorers
      windowHeight = document.body.clientHeight;
    }	
    return windowHeight
  }

  // Backwards compatibility
  function makeCompatible() {
    var $s = jq14.facebox.settings

    $s.loadingImage = $s.loading_image || $s.loadingImage
    $s.closeImage = $s.close_image || $s.closeImage
    $s.imageTypes = $s.image_types || $s.imageTypes
    $s.faceboxHtml = $s.facebox_html || $s.faceboxHtml
  }

  // Figures out what you want to display and displays it
  // formats are:
  //     div: #id
  //   image: blah.extension
  //    ajax: anything else
  function fillFaceboxFromHref(href, klass) {
    // div
    if (href.match(/#/)) {
      var url    = window.location.href.split('#')[0]
      var target = href.replace(url,'')
      jq14.facebox.reveal(jq14(target).clone().show(), klass)

    // image
    } else if (href.match(jq14.facebox.settings.imageTypesRegexp)) {
      fillFaceboxFromImage(href, klass)
    // ajax
    } else {
      fillFaceboxFromAjax(href, klass)
    }
  }

  function fillFaceboxFromImage(href, klass) {
    var image = new Image()
    image.onload = function() {
      jq14.facebox.reveal('<div class="image"><img src="' + image.src + '" /></div>', klass)
    }
    image.src = href
  }

  function fillFaceboxFromAjax(href, klass) {
    jq14.get(href, function(data) { jq14.facebox.reveal(data, klass) })
  }

  function skipOverlay() {
    return jq14.facebox.settings.overlay == false || jq14.facebox.settings.opacity === null 
  }

  function showOverlay() {
    if (skipOverlay()) return

    if (jq14('facebox_overlay').length == 0) 
      jq14("body").append('<div id="facebox_overlay" class="facebox_hide"></div>')

    jq14('#facebox_overlay').hide().addClass("facebox_overlayBG")
      .css('opacity', jq14.facebox.settings.opacity)
      .click(function() { jq14(document).trigger('close.facebox') })
      .fadeIn(200)
    return false
  }

  function hideOverlay() {
    if (skipOverlay()) return

    jq14('#facebox_overlay').fadeOut(200, function(){
      jq14("#facebox_overlay").removeClass("facebox_overlayBG")
      jq14("#facebox_overlay").addClass("facebox_hide") 
      jq14("#facebox_overlay").remove()
    })
    
    return false
  }

  /*
   * Bindings
   */

  jq14(document).bind('close.facebox', function() {
    jq14(document).unbind('keydown.facebox')
    jq14('#facebox').fadeOut(function() {
      jq14('#facebox .lightbox_content').removeClass().addClass('lightbox_content')
      hideOverlay()
      jq14('#facebox .loading').remove()
    })
  })

})(jQuery);
