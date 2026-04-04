const Product = require('../models/product');

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const imageUrl = req.body.imageUrl;
    const price = req.body.price;
    const description = req.body.description;

    const product = new Product({
        title: title,
        price: price,
        description: description,
        imageUrl: imageUrl,
        userId: req.user 
    });

    product
        .save()
        .then(result => {
            console.log('Created Product');
            res.redirect('/admin/products');
        })
        .catch(err => {
            console.log(err);
        });
};
exports.postEditProduct = (req, res, next) => {
  const { productId, title, price, description, imageUrl } = req.body;

  Product.findById(productId)
  .then(product=>{
    product.title=title; 
    product.price=price; 
    product.description=description; 
    product.imageUrl=imageUrl;
    return product.save()
  })
    .then(result => {
      res.redirect('/admin/products');
    })
    .catch(err => console.log(err));
};
exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false
    });
};
exports.getProducts=(req,res,next)=>{
    Product.find()
    .then(products=>{
        res.render('admin/products',{
            prods:products,
            pageTitle:'Admin products',
            path:'/admin/products'
        })
    })
    .catch(err=>{
        console.Consolelog(err)
    })
}
exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;

  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product
      });
    })
    .catch(err => console.log(err));
};
exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findByIdAndDelete(prodId)
    .then(() => {
      console.log('Product Deleted');
      res.redirect('/admin/products');
    })
    .catch(err => {
      console.log(err);
      res.redirect('/admin/products');
    });
};