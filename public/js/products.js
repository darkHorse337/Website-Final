function addCart(id,name){
  //$('#main_loading').show();
  $.ajax({
    url : "/addItem",
    cache : false,
    method : "post",
    data : {
      itemid : id,
      name : name
    },
    success : function(data){
      //console.log(data);
      //item_added.innerHTML="Hello"
    },
    complete : function(){
  //    $('#img-loading').hide();
      $('#after-loading').show(name);
      $('#item_added').html("hello");
    }
  })
}


function add(idx,namex,pricex,quantityx){
  $('#main_loading').show();
  //$('#item_added').html("hello");
  $.ajax({
    url : "/add",
    cache : false,
    method : "post",
    data : 
    {
	  code:idx,
      name : namex,
      price : pricex,
      quantity:quantityx
    },
    success : function(data){
      //console.log(data);
      //$('#item_added').html("hello");
    },
    complete : function(){
      $('#img-loading').hide();
      $('#item_added').html("<div style='font-size: 12px;'>"+namex+" Added To Web Cart</div>");
      $('#after-loading').show();
    }
  })
}

function closeModal(){
  $('#main_loading').hide();
}
