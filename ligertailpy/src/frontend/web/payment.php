<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>Payment Page</title>
<link href="css/ligertail_global.css" rel="stylesheet" type="text/css" />
<meta name="description" content="Description" />
<meta name="keywords" content="Keywords" />
   
</head>

<body>

<div id="header">
<div class="wrapper">

</div>
</div>

<div id="main_content">
<div class="wrapper">
<? include ('header.php') ?>
<div id="page_top">&nbsp;</div>
<div class="page">
<h1>Purchase Placement for <span class="orange">http://nytimes.com</span></h1>
<form action="" method="post" enctype="multipart/form-data" name="form1" id="form_payment">
<table width="475" align="center" class="table_stats" style="margin-bottom:15px;">
<tr>
<th colspan="3">Your Payment Details</th>
</tr>
    <tr>
<td width="182" align="right"> <strong>Name</strong></td>
<td width="190" align="left"><input name="name_first2" type="text" class="input_form" id="name_first2" /></td>
<td width="87" align="left"><input type="submit" name="cancel" id="cancel" value="Cancel" /></td>
    </tr>
    
    <tr>
<td align="right"> <strong>Address</strong></td>
<td align="left"><input name="name_first2" type="text" class="input_form" id="name_first2" /></td>
<td align="left">&nbsp;</td>
    </tr>
    
    <tr>
<td align="right"> <strong>City</strong></td>
<td align="left"><input name="name_first2" type="text" class="input_form" id="name_first2" /></td>
<td align="left">&nbsp;</td>
    </tr>
     <tr>
        <td align="right"><strong>State</strong></td>
        <td align="left"><select name="select" id="select">
        </select></td>
        <td align="left">&nbsp;</td>
    </tr>
     <tr>
        <td align="right"><strong>Zip</strong></td>
        <td align="left"><input name="name_first4" type="text" class="input_form_short" id="name_first4" /></td>
        <td align="left">&nbsp;</td>
    </tr>
    <tr>
        <td align="right"><strong>Credit Card Number</strong></td>
        <td align="left"><input name="cc_number" type="text" class="input_form" id="cc_number" /></td>
        <td align="left">&nbsp;</td>
    </tr>
    <tr>
        <td align="right"><strong>CC Expiration</strong></td>
        <td align="left"><input name="cc_exp" type="text" class="input_form" id="cc_exp" /></td>
        <td align="left">&nbsp;</td>
    </tr>
    <tr>
        <td align="right"><strong>CVC</strong></td>
        <td align="left"><input name="name_first" type="text" class="input_form_short" id="name_first" /></td>
        <td align="left"><input type="submit" name="pay_now" id="pay_now" value="PAY NOW" /></td>
    </tr>
</table>
</form>
  
<div id="payment">
  <div id="analytics">
  <h3>Promoted Content</h3>
<div class="entry">
  <div class="pricing">
    <input name="textfield7" type="text" class="input_form_price" id="textfield3" value="Price" />
  </div>
  <div class="text"><span class="source">YOUR CONTENT</span>
    <p>Please be sure to input a description.</p>
  </div>
 <span class="close"><a href="#"><img src="images/button_close.png" alt="Delete" width="18" height="18" border="0" /></a></span>
<div class="share"><a href="#"><img src="images/button_share_2.png" alt="Share" width="16" height="16" border="0" /></a></div>
</div>

<div class="entry">
  <div class="pricing">$248</div>
  <div class="text"><span class="source">Nosaj Thing</span>
    <p>Dj Set (Live on KEXP)</p>
  </div>
</div>

<div class="entry">
  <div class="pricing">$8</div>
  <div class="text"><span class="source">Nosaj Thing</span>
    <p>Dj Set (Live on KEXP)</p>
  </div>
</div>
</div>

<div id="graphs">
  <h3>Analytics</h3>
<img src="images/graph_1.png" alt="Graph" width="274" height="120" align="left" />
<table width="290" border="0" cellpadding="0" cellspacing="0" class="table_stats">
  <tr>
    <th scope="col">Statistics</th>
    <th scope="col">&nbsp;</th>
    <th scope="col">&nbsp;</th>
    <th scope="col">&nbsp;</th>
  </tr>
  <tr>
    <td>Total</td>
    <td>&nbsp;</td>
    <td>&nbsp;</td>
    <td>&nbsp;</td>
  </tr>
  <tr>
    <td>Per Hour</td>
    <td>&nbsp;</td>
    <td>&nbsp;</td>
    <td>&nbsp;</td>
  </tr>
  <tr>
    <td>CRM</td>
    <td>&nbsp;</td>
    <td>&nbsp;</td>
    <td>&nbsp;</td>
  </tr>
</table>
<div style="clear:both;"><br /></div>
<img src="images/graph_2.png" alt="Graph" width="274" height="122" align="left" />
<table width="290" border="0" cellpadding="0" cellspacing="0" class="table_stats">
    <tr>
      <th scope="col">Statistics</th>
      <th scope="col">&nbsp;</th>
      <th scope="col">&nbsp;</th>
      <th scope="col">&nbsp;</th>
    </tr>
    <tr>
      <td>Total</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
    </tr>
    <tr>
      <td>Per Hour</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
    </tr>
    <tr>
      <td>CRM</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
    </tr>
  </table>

</div>
</div>
   
    
    <div style="clear:both;"></div>
</div>
<div id="page_bottom">&nbsp;</div>
</div>

<div style="clear:both;"></div>
</div>
</div>

<div id="sub_content">
<?php include ('sub_content.php') ?>
</div>
</div>

</div>
  
 
<div id="footer">
<div class="wrapper">
<div class="fourth">
<img src="images/icon_ligertail_blocks.png" alt="LigerTail" width="50" height="47" align="left" />
<ul class="footer">
<li>FOOTER LINKS</li><li>FOOTER LINKS</li>
</ul> </div>


<div style="clear:both;"></div>
<p class="center">Ligertail &copy;2010</p>
</div>

</div>

</body>
