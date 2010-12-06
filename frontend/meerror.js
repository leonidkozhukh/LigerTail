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
LoadFile("main.css", "css");

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
		jQuery.atype: "POST",
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
	jQuery(".content a").click(function(){
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
	jQuery(".content iframe").click(function(){ alert("event_tracking.php?location=" + location.href + "&event=liked&content_id=" + jQuery(this).parent().attr("id"));
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
		url: "http://localhost:8080/get_ordered_items,
		data: "",
		dataType: "json",
		success: function(d){
			var content = "";
			jQuery.each(d.items, function(i, item){				
				content += '<div class="content" id="' + item.id + '"><img class="close" src="static/close.jpeg"><a href="' + item.url + '"><img class="thumb" src="' + item.thumbnail + '"><div class="description">' + item.title + '</div></a><iframe src="http://www.facebook.com/plugins/like.php?href=' + encodeURI(item.url) + '&amp;layout=button_count&amp;show_faces=false&amp;width=50&amp;action=like&amp;font=trebuchet+ms&amp;colorscheme=dark&amp;height=21" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:50px; height:21px;" allowTransparency="true"></iframe></div>';
			});
			
			jQuery(".meerror").append(content);
			AddEvents();

			//show first X (depending on length of widget) - right now 5
			jQuery(".meerror .content:lt(5)").trigger("show");
			
		},
		error:  function (xmlHttpRequest, textStatus, errorThrown) {
         if(xmlHttpRequest.readyState == 0 || xmlHttpRequest.status == 0) 
              return;  // it's not really an error
         else
             alert(xmlHttpRequest + errorThrown); // Do normal error handling
		}
	});
}

//LOAD SUBMISSION LIGHTBOX

function OpenLightbox(url){
	$.facebox(function(){ 	
		//add in top 4 pieces of content to preview
		$.facebox({ ajax: "submission.html"});
		//error checking on submission form
		
		// Call embedly
		$.ajax({
			type: "GET",
			url: "http://api.embed.ly/v1/api/oembed?callback=?&url=" + url,
			dataType: "json",
			success: function(data){ alert(data.thumbnail_url);
				$("#submission #title").val(data.title);
				$("#submission .description").html(data.title);	
				$("#submission textarea").val(data.description);
				$("#submission .thumb").attr("src", data.thumbnail_url);
				$("#submission #final_url").val(url);
				$("#submission .content a").attr("href", url);
			},
			error: function(e){ alert("error: " + e);}		
		});
		

		$(document).bind('reveal.facebox', function(){ 

		
			$("#submission #work #final_url").blur(function(){ 
				if(!ValidateURL($(this).val()))
					$("#submission #work label:first").css("color", "red");
				else if($("#submission #work label:first").css("color") == "red")
					$("#submission #work label:first").css("color", "black");
			});
			
			$("#submission #work #title").blur(function(){ 
				if($(this).val().length < 3 || $(this).val().length > 100)
					$("#submission #work label:nth-child(3)").css("color", "red");
				else{
					$("#submission #meerror .content .description").html($(this).val());
					if($("#submission #work label:nth-child(3)").css("color") == "red")
						$("#submission #work label:nth-child(3)").css("color", "black");
				}
			});

			$("#submission #work #description").blur(function(){
				if($(this).val().length > 512)
					$("#submission #work label:last").css("color", "red");
				else if($("#submission #work label:last").css("color") == "red")
					$("#submission #work label:last").css("color", "black");
			});

			$("#submission #work").submit(function(){ 
				event.preventDefault();
				var submitted_url = $("#submission #work #final_url").val(); 
				var submitted_title = $("#submission #work #title").val();
				var submitted_description = $("#submission #work #description").val();

				//if url same as original, use embedly img
				var img_src = "";
				if(submitted_url == url)
					img_src = $("#submission .thumb").attr("src");
				else
					img_src = "default.png";

				if(ValidateURL(submitted_url) && 
					(submitted_title.length > 3 && submitted_title.length < 100) && 
					submitted_description.length < 512){

					$.ajax({
						type: "POST",
						url: "post_content.php?location=" + location.href + "&url=" + submitted_url + "&title=" + submitted_title + "&description=" + submitted_description + "&thumbnail=" + img_src,
						dataType: "text",
						success: function(){
							$("#meerror .content:first").before('<div class="content"><img class="close" src="static/close.jpeg"><a href="' + submitted_url + '"><img class="thumb" src="' + img_src + '"><div class="description">' + submitted_title + '</div></a><iframe src="http://www.facebook.com/plugins/like.php?href=' + encodeURI(submitted_url) + '&amp;layout=button_count&amp;show_faces=false&amp;width=50&amp;action=like&amp;font=trebuchet+ms&amp;colorscheme=dark&amp;height=21" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:50px; height:21px;" allowTransparency="true"></iframe></div>');
							jQuery(document).trigger('close.facebox');
							AddEvents();
						},
						error: function(e){ alert("error: " + e);}
					});
				}
				else{ 
					if(!ValidateURL(submitted_url))
						$("#submission #work label:first").css("color", "red");
					else if($("#submission #work label:first").css("color") == "red")
						$("#submission #work label:first").css("color", "black");

					if(submitted_title.length < 3 || submitted_title.length > 100)
						$("#submission #work label:nth-child(3)").css("color", "red");
					else if($("#submission #work label:nth-child(3)").css("color") == "red")
						$("#submission #work label:nth-child(3)").css("color", "black");
	
					if(submitted_description.length > 512)
						$("#submission #work label:last").css("color", "red");
					else if($("#submission #work label:last").css("color") == "red")
						$("#submission #work label:last").css("color", "black");
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
	$(".meerror").append('<div id="url"><form><input type="text" value="Contribute your content. Submit URL..."><input class="submit" type="submit"></form></div>');
	$("#meerror2").css("height", "450px");

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