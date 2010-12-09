package com.ligertail.backend.testing;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.logging.Logger;

import com.google.appengine.repackaged.org.json.JSONArray;
import com.google.appengine.repackaged.org.json.JSONException;
import com.google.appengine.repackaged.org.json.JSONObject;

public class LoadTester {
  
  private static final Logger log = Logger.getLogger(LoadTester.class.getName());
  private final String domain;
  private static AtomicInteger submitId = new AtomicInteger(0);
  
  public LoadTester(String domain) {
    this.domain = domain;
  }
  
  private Map<String, String> createNewItemProps(String publisherUrl) {
    Map<String, String> keyval = new HashMap<String, String>();
    int id = submitId.incrementAndGet();
    keyval.put("url", "www.itemurl.com/" + id);
    keyval.put("title", "item" + id);
    keyval.put("description", "this is item number " + id);
    keyval.put("email", "m@m.com");
    keyval.put("publisherUrl", publisherUrl);
    keyval.put("price", String.valueOf((int)(Math.random() * 100.0)));
    return keyval;
  }
  
  public JSONObject submitItem(String publisherUrl) {
    Map<String, String> keyval = createNewItemProps(publisherUrl);
    return post(keyval, "submit_item");
  }
  
  public JSONObject submitPaidItem(String publisherUrl) {
    Map<String, String> keyval = createNewItemProps(publisherUrl);
    keyval.put("price", String.valueOf((int)(Math.random() * 100.0)));
    return post(keyval, "submit_paid_item");
    
  }

  public JSONObject getItems(String publisherUrl) {
    Map<String, String> keyval = new HashMap<String, String>();
    keyval.put("publisherUrl", publisherUrl);
    return post(keyval, "get_ordered_items");
    
  }
  
  public JSONObject getPaidItems(String publisherUrl) {
    Map<String, String> keyval = new HashMap<String, String>();
    keyval.put("publisherUrl", publisherUrl);
    return post(keyval, "get_paid_items");
    
  }
  
  public JSONObject submitUserInteraction(String publisherUrl, String interactions) {
    Map<String, String> keyval = new HashMap<String, String>();
    keyval.put("publisherUrl", publisherUrl);
    keyval.put("interactions", interactions);
    return post(keyval, "submit_user_interaction");    
  }

  public JSONObject getFilter(String publisherUrl) {
    Map<String, String> keyval = new HashMap<String, String>();
    //keyval.put("publisherUrl", publisherUrl);
    return post(keyval, "get_filter");
  }

  public JSONObject submitFilter(String publisherUrl) {
    Map<String, String> keyval = new HashMap<String, String>();
    keyval.put("publisherUrl", publisherUrl);
    keyval.put("filter.popularity", "30");
    keyval.put("filter.recency", "70");
    return post(keyval, "submit_filter");
  }

  public JSONObject getItemStats(String publisherUrl, String itemId) {
    Map<String, String> keyval = new HashMap<String, String>();
    keyval.put("publisherUrl", publisherUrl);
    keyval.put("itemId", itemId);
    return post(keyval, "get_item_stats");
  }
  
  private JSONObject post(Map<String, String> keyValues, String cmd) { 
    try {
      log.info("############### Posting data to " + cmd);
      // Construct data
      String data = "";
      boolean first = true;
      for (Map.Entry<String, String> entry : keyValues.entrySet()) {
        if (! first) {
          data += "&"; 
        } else {
          first = false;
        }
        data += "&" + URLEncoder.encode(entry.getKey(), "UTF-8") + "=" + URLEncoder.encode(entry.getValue(), "UTF-8");
      }

      // Send data
      URL url = new URL(domain + "/" + cmd);
      URLConnection conn = url.openConnection();
      conn.setDoOutput(true);
      OutputStreamWriter wr = new OutputStreamWriter(conn.getOutputStream());
      wr.write(data);
      wr.flush();

      // Get the response
      BufferedReader rd = new BufferedReader(new InputStreamReader(conn.getInputStream()));
      String jsonResponse = "";
      String line;
      while ((line = rd.readLine()) != null) {
          log.info(line);
          jsonResponse += line;
      }
      JSONObject json = new JSONObject(jsonResponse);
      wr.close();
      rd.close();
      return json;
    } catch (Exception e) {
      log.warning("Post failed." +  e.getMessage());
    }
    return null;
  }
  
  public static void main(String [ ] args) throws JSONException {
    
    Map<String, String> argMap = new HashMap<String, String>();
    for (String arg : args) {
      String[] keyval = arg.split("=");
      argMap.put(keyval[0], keyval[1]);
    }
    if (!argMap.containsKey("domain")) {
      System.err.println("domain argument is missing");
      System.exit(2);
    }
    LoadTester loadTester = new LoadTester(argMap.get("domain"));
    String publisherUrl = "www.nytimes3.com";
    
   /* for (int i = 0; i < 10; i++) {
      loadTester.submitItem(publisherUrl);
    }
    JSONObject json = loadTester.getItems(publisherUrl);
    //loadTester.getItemStats(publisherUrl, "23");
    JSONArray items = json.getJSONArray("items");
 3   JSONObject item = new JSONObject((String)items.get(0));
    
    String itemId = item.getString("id");
    loadTester.submitUserInteraction(publisherUrl, 
        itemId + ":4,"
        + itemId + ":3,"
        + itemId + ":3");
    json = loadTester.getItemStats(publisherUrl, itemId);
    for (int i = 0; i < 10; i++) {
      //loadTester.submitItem(publisherUrl);
      //loadTester.submitPaidItem(publisherUrl);
      //loadTester.getItems(publisherUrl);
      //loadTester.getPaidItems(publisherUrl);
      //loadTester.submitUserInteraction(publisherUrl, "23:4, 32:1");
      //loadTester.getFilter(publisherUrl);
      //loadTester.submitFilter(publisherUrl);
      
    }
    
    for (int i = 0; i < 10; i++) {
      loadTester.submitPaidItem(publisherUrl);
      loadTester.submitItem(publisherUrl);
    }*/
    loadTester.submitPaidItem(publisherUrl);
    loadTester.submitPaidItem(publisherUrl);
    loadTester.submitPaidItem(publisherUrl);
    loadTester.submitPaidItem(publisherUrl);
    loadTester.submitPaidItem(publisherUrl);
    loadTester.submitPaidItem(publisherUrl);
    loadTester.submitPaidItem(publisherUrl);
    loadTester.submitPaidItem(publisherUrl);
    
    loadTester.submitItem(publisherUrl);
    loadTester.getItems(publisherUrl);
    loadTester.getPaidItems(publisherUrl);
    loadTester.submitUserInteraction(publisherUrl, "23:4, 32:1");
    loadTester.getFilter(publisherUrl);

    loadTester.submitFilter(publisherUrl);
    loadTester.getItems(publisherUrl);
  } 
}
 
