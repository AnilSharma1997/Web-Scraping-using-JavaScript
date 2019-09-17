const request = require('request');
const cheerio = require('cheerio');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// structure of csv file format
const csvWriter = createCsvWriter({
  path: '.csv',
  header: [
    {id: 'ProductName', title: 'ProductName'},
    {id: 'ProductUrl', title: 'ProductUrl'},
    {id: 'ProductBrand',title:'ProductBrand'},
    {id:'ProductPrice', title:'ProductPrice'},
    {id:'ProductQuantity', title: 'ProductQuantity'},
    {id:'ProductMRP', title:'ProductMRP'}
  ]
});
// this is the given url
let givenUrl = 'https://www.industrybuying.com/safety-1224/';

let url = givenUrl+'all-products/';
let total_page;

request(url, function(err, resp, html){
  if (!err){
    // load the whole page using cheerio
    const $ = cheerio.load(html);
    var total_product = $('.productslimit').text();
    // scrap the total number of product
      total_product = total_product.substring(0, total_product.length - 1);
      total_page = Math.ceil(test(total_product)/60)
      console.log(total_page );
      getDetails(total_page,total_product,url);
}
})

function test(words) {
  var n = words.split(" ");
  return n[n.length - 1];
}


function getDetails(total_page,total_product,Url){
  var i = 1;
  const data = [];
  function next(){
    // this loop iterates all the pages. for testing we can take i<2 or i<3
      if(i<total_page){
        // this is for pagination, when page>1 then url will be changed
        if(i>1){
          url = Url+`?page=`+i;
        }
          request(url, function(err, resp, html){
            if (!err){
              const $ = cheerio.load(html);
              $('.AH_ProductView').each((i,elem)=>{
                data.push({
                   ProductName : $(elem).find('.prFeatureName').text().trim(),
                   ProductUrl : $(elem).find('a').attr('href'),
                   ProductBrand : $(elem).find('[class=brand]').text(),
                  // ImageUrl  :  $(elem).find('.AH_LazyLoadImg').attr('src')
                });
            });
          }  
              ++i;
              return next();
          })
      }
      else{
        getMoreDetail(data,total_product);
      }
  }
  return next();
}

function getMoreDetail(data,total_product){
  let products=[];
  let total_product = total_product;
  var i = 0;
  function next(){
    // it will take long time so we can take this for page 1 or till page 2 (i<60 or i<120)
      if(i<total_product){
          let url = `https://www.industrybuying.com`+ data[i].ProductUrl;

          let ProductName = data[i].ProductName;
          let ProductUrl =  data[i].ProductUrl;
          let ProductBrand = data[i].ProductBrand;

          request(url, function(err, resp, html){
              if (!err){
                  const $ = cheerio.load(html);
                  if($('.tbodyClass').length>0){
                      $('.tbodyClass').each((i,elem)=>{
                        ProductMRP = $(elem).find('[class=strike]').html();
                        // some products doesn't have any MRP so we check here
                        if(ProductMRP){
                          products.push({
                            ProductName : ProductName,
                            ProductUrl : ProductUrl,   
                            ProductBrand : ProductBrand,
                          ProductPrice: $(elem).find('[class=family-price]').html(),
                          ProductQuantity: $(elem).find('[class=box-qty]').html().charAt($(elem).find('[class=box-qty]').html().indexOf('min=')+5),
                          ProductMRP: $(elem).find('[class=strike]').html().replace(/\W/g, '')
                        });
                        }
                        else{
                          products.push({
                            ProductName : ProductName,
                            ProductUrl : ProductUrl,   
                            ProductBrand : ProductBrand,
                          ProductPrice: $(elem).find('[class=family-price]').html(),
                          ProductQuantity: $(elem).find('[class=box-qty]').html().charAt($(elem).find('[class=box-qty]').html().indexOf('min=')+5),
                        });
                    }
                  });
                  }
                  else{
                      $('.AH_RightArea').each((i,elem)=>{
                        ProductPrice = $(elem).find('[class=price]').html();
                        // in some cases product price class are different so we use this
                        if(ProductPrice){
                          products.push({
                            ProductName : ProductName,
                            ProductUrl : ProductUrl,   
                            ProductBrand : ProductBrand,
                          ProductPrice: $(elem).find('[class=price]').html().replace(/\D/g, ''),
                          ProductQuantity: $(elem).find('[class=box-qty]').html().charAt($(elem).find('[class=box-qty]').html().indexOf('min=')+5),
                          ProductMRP: $(elem).find('[class=AH_PricePerPiece]').html().replace(/\W/g, '')
                        });
                        }
                        else{
                          products.push({
                            ProductName : ProductName,
                            ProductUrl : ProductUrl,   
                            ProductBrand : ProductBrand,
                            ProductPrice: $(elem).find('[class=mainPrice]').html().replace(/\D/g, '')
                          });
                        }

                    });
                  }
              }
              ++i;
              return next();
          })
      }
      else{
          console.log(products);
          // to store all the data I use csvWriter
          csvWriter
          .writeRecords(products)
          .then(()=> console.log('The CSV file was written successfully')); 
      }
  }
  return next();
}

