//LOAD DEPENDENCIES

function LoadFile(filename, filetype){
	if (filetype == "js"){ //if filename is a external JavaScript file
  		var fileref = document.createElement('script');
  		fileref.setAttribute("type", "text/javascript");
  		fileref.setAttribute("src", filename);
 	}
 	else if (filetype == "css"){ //if filename is an external CSS file
 		var fileref = document.createElement("link");
  		fileref.setAttribute("rel", "stylesheet");
  		fileref.setAttribute("type", "text/css");
  		fileref.setAttribute("href", filename);
 	}

 	if (typeof fileref != "undefined")
 		 document.getElementsByTagName("head")[0].appendChild(fileref);
}


LoadFile("http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js", "js");
LoadFile("facebox.js", "js");
LoadFile("facebox.css", "css");
LoadFile("css/widget_1.css", "css");

//LOAD PUBLISHER-SET PARAMETERS

function SetupParameters(){
	///////////////////////////////
	var file_name = 'meerror.js';
	///////////////////////////////
    	scripts = document.getElementsByTagName("script"); 
    	var i, j, src, parts, basePath, options = {};

	for (i = 0; i < scripts.length; i++) {
  		src = scripts[i].src;
 		if (src.indexOf(file_name) != -1) {
   			parts = src.split('?');
    			basePath = parts[0].replace(file_name, '');
    			if (parts[1]) {
      				var opt = parts[1].split('&');
      				for (j = opt.length-1; j >= 0; --j) {
        				var pair = opt[j].split('=');
        				options[pair[0]] = pair[1];
      				}
    			}
   			return options;
  		}
	}
}

//URL VALIDATION FUNCTION

function ValidateURL(str){
	var text = str.replace(/<\/?[^>]+(>|$)/g, "");
	var exp = /(\bhttp:\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
	var url = text.match(exp);
	
	if(url != null && url.length > 1){
     		return false;
    	}
	else if(url != null){
		return url[0];
	}
	else 
		return false;
}

//EMAIL VALIDATION FUNCTION

function ValidateEmail(str) {
	var reg = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
	if(reg.test(str) == false) {
		return false;
	}
	else return str;  
}

//BIND EVENTS TO CONTENT OBJECTS

function AddEvents(){
	jQuery(".content").bind("show", function(){
		jQuery(this).show("fast");
		//this is a view
		jQuery.ajax({
			type: "POST",
			url: "http://localhost:8080/submit_user_interaction",
			data: ({publisherUrl: submit_publisherUrl, interactions: jQuery(this).attr("id") + ':1'}),
			dataType: "json",
			success: function(data){},
			error: function(e){ alert("error: " + e);}
		});
	});


	//remove the current content, move stack up, add new content, & update db
	jQuery(".content .close").click(function(){
		//this is a close
		jQuery.ajax({
			type: "POST",
			url: "",
			data: "",
			success: function(){},
			error: function(e){ alert("error: " + e);}
		});
		jQuery(this).parent().remove();
		jQuery(".content:hidden").filter(":first").trigger("show");
	});

	//update db
	jQuery(".content .image, .text").click(function(){
		event.preventDefault();
		//this is a click
		jQuery.ajax({
			type: "POST",
			url: "",
			data: "",
			success: function(){},
			error: function(e){ alert("error: " + e);}
		});

		//OpenAnalytics(jQuery(this).parent().attr("id"));
	});

	//update db
	jQuery(".content .share").click(function(){ 
		//this is a like
		jQuery.ajax({
			type: "POST",
			url: "",
			data: "",
			success: function(){},
			error: function(e){ alert("error: " + e);}
		});

		//jQuery(this).parent().remove();
	});
}

//SECOND PART OF SUBMISSION PROCESS

function OpenAnalytics(id){
	jQuery.facebox(function(){ 	
		jQuery.facebox('<div id="graphs_top"><div class="graphs_left"></div><div class="graphs_right"></div></div><div id="graphs_bottom"><div class="graphs_left"></div><div class="graphs_right"></div></div>');
		
		jQuery.ajax({
			type: "POST",
			url: "",
			data: "",
			dataType: "json",
			success: function(data){
				//jQuery("#graphs_top .graphs_left").append(data);
			}
		});

		jQuery.ajax({
			type: "POST",
			url: "",
			data: "",
			dataType: "json",
			success: function(data){
				//jQuery("#graphs_top .graphs_right").append(data);
			}
		});

		jQuery.ajax({
			type: "POST",
			url: "",
			data: "",
			dataType: "json",
			success: function(data){
				//jQuery("#graphs_bottom .graphs_left").append(data);
			}
		});

		jQuery.ajax({
			type: "POST",
			url: "",
			data: "",
			dataType: "json",
			success: function(data){
				//jQuery("#graphs_bottom .graphs_right").append(data);
			}
		});
	});
}

//LOAD CONTENT OBJECTS

function GetContent(){
	jQuery.ajax({
		type: "POST",
		url: "http://localhost:8080/get_ordered_items",
		data: "",
		dataType: "json",
		success: function(d){
			var content = "";
			jQuery.each(d.items, function(i, item){				
				content += '<div class="content"><div class="close" id="' + item.id + '"><img src="images/button_delete.png" width="18" height="18" alt="Delete" /></div><div class="image"><img src="' + item.thumbnail + '" width="105" height="65" alt="Image" /></div><div class="text"><span class="source">BBC Wildlife</span><span class="title">' + item.title + '</span><p>' + item.description + '</p></div><div class="share"><img src="images/button_share.png" width="23" height="22" alt="Share" /></div></div>';
			});
			
			jQuery(".content:last").append(content);
			AddEvents();

			//show first X (depending on length of widget) - right now 5
			jQuery(".widget_1 .content:lt(5)").trigger("show");
			
		},
		error:  function(e) { alert("error: " + e);}
	});
}

//LOAD SUBMISSION LIGHTBOX

function OpenLightbox(url){
	jQuery.facebox(function(){ 	
		//add in top 4 pieces of content to preview
		jQuery.facebox({ ajax: "submission.html"});
		//error checking on submission form
		
		// Call embedly
		jQuery.ajax({
			type: "GET",
			url: "http://api.embed.ly/v1/api/oembed?callback=?&url=" + url,
			dataType: "json",
			success: function(data){ alert(data.thumbnail_url);
				jQuery("#submission #title").val(data.title);
				jQuery("#submission .description").html(data.title);	
				jQuery("#submission textarea").val(data.description);
				jQuery("#submission .thumb").attr("src", data.thumbnail_url);
				jQuery("#submission #final_url").val(url);
				jQuery("#submission .content a").attr("href", url);
			},
			error: function(e){ alert("error: " + e);}		
		});
		

		jQuery(document).bind('reveal.facebox', function(){ 

		
			jQuery("#submission #work #final_url").blur(function(){ 
				if(!ValidateURL(jQuery(this).val()))
					jQuery("#submission #work label:first").css("color", "red");
				else if(jQuery("#submission #work label:first").css("color") == "red")
					jQuery("#submission #work label:first").css("color", "black");
			});
			
			jQuery("#submission #work #title").blur(function(){ 
				if(jQuery(this).val().length < 3 || jQuery(this).val().length > 100)
					jQuery("#submission #work label:nth-child(3)").css("color", "red");
				else{
					jQuery("#submission #meerror .content .description").html(jQuery(this).val());
					if(jQuery("#submission #work label:nth-child(3)").css("color") == "red")
						jQuery("#submission #work label:nth-child(3)").css("color", "black");
				}
			});

			jQuery("#submission #work #description").blur(function(){
				if(jQuery(this).val().length > 512)
					jQuery("#submission #work label:last").css("color", "red");
				else if(jQuery("#submission #work label:last").css("color") == "red")
					jQuery("#submission #work label:last").css("color", "black");
			});

			jQuery("#submission #work").submit(function(){ 
				event.preventDefault();
				var submitted_url = jQuery("#submission #work #final_url").val(); 
				var submitted_title = jQuery("#submission #work #title").val();
				var submitted_description = jQuery("#submission #work #description").val();

				//if url same as original, use embedly img
				var img_src = "";
				if(submitted_url == url)
					img_src = jQuery("#submission .thumb").attr("src");
				else
					img_src = "default.png";

				if(ValidateURL(submitted_url) && 
					(submitted_title.length > 3 && submitted_title.length < 100) && 
					submitted_description.length < 512){

					jQuery.ajax({
						type: "POST",
						url: "post_content.php?location=" + location.href + "&url=" + submitted_url + "&title=" + submitted_title + "&description=" + submitted_description + "&thumbnail=" + img_src,
						dataType: "text",
						success: function(){
							jQuery("#meerror .content:first").before('<div class="content"><img class="close" src="static/close.jpeg"><a href="' + submitted_url + '"><img class="thumb" src="' + img_src + '"><div class="description">' + submitted_title + '</div></a><iframe src="http://www.facebook.com/plugins/like.php?href=' + encodeURI(submitted_url) + '&amp;layout=button_count&amp;show_faces=false&amp;width=50&amp;action=like&amp;font=trebuchet+ms&amp;colorscheme=dark&amp;height=21" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:50px; height:21px;" allowTransparency="true"></iframe></div>');
							jQuery(document).trigger('close.facebox');
							AddEvents();
						},
						error: function(e){ alert("error: " + e);}
					});
				}
				else{ 
					if(!ValidateURL(submitted_url))
						jQuery("#submission #work label:first").css("color", "red");
					else if(jQueryjQuery("#submission #work label:first").css("color") == "red")
						jQuery("#submission #work label:first").css("color", "black");

					if(submitted_title.length < 3 || submitted_title.length > 100)
						jQuery("#submission #work label:nth-child(3)").css("color", "red");
					else if(jQuery("#submission #work label:nth-child(3)").css("color") == "red")
						jQuery("#submission #work label:nth-child(3)").css("color", "black");
	
					if(submitted_description.length > 512)
						jQuery("#submission #work label:last").css("color", "red");
					else if(jQuery("#submission #work label:last").css("color") == "red")
						jQuery("#submission #work label:last").css("color", "black");
				}
			});
		});		
	});
}

//MAIN INSTANCE

jQuery(document).ready(function($){
	//LOAD SETUP PARAMETERS
	//
	// width: (300px or 600px)
	// height: (minimum 250px + 45px or 500-ish + 120-ish)
	// border: false, default
	//
	//var params = SetupParameters();

	//LOAD INPUT FORM
	$(".widget_1").append('<div id="header"><img src="images/input_submit.png" width="559" height="24" alt="Input" /></div><div id="footer"><img src="images/logo_footer.png" width="116" height="35" alt="Logo" /></div>');
	

	//LOAD CONTENT
	GetContent();
	
	//BIND BEHAVIORAL EVENTS FOR INPUT FORM
		

	//focus in on hover or click
	$("#url input").hover(function(){ 
		if($(this).val() == "Contribute your content. Submit URL...")
			$(this).val("http://").select();
		else
			$(this).select();
	}, 
	function(){
		if($(this).val() == "")
			$(this).val("Contribute your content. Submit URL...").blur();
		else
			$(this).blur();
	})

	//open lightbox on submission & save input in db
	$("#url form").submit(function(){ //open lightbox & save input in db
		event.preventDefault();
		var url = $(this).find("input:first").val();
		OpenLightbox(url);
	});
	
	//SHOULD BE IN SUBMISSION BEHAVIOR EVENTS: LOAD PAYMENT ACCEPTANCE	
	//separate from submission, additional steps...

	//LOAD USER TRACKING

	

});