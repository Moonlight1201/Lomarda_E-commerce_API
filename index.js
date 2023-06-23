const express = require ('express');

const app = express();

const port = 4000;

app.use(express.json());

let users = [
    {
        email: "rallomarda@gmail.com",
        password: "helloworld",
        isAdmin: true
    },
    {
        email: "rosemarie@gmail.com",
        password: "hiworld",
        isAdmin: false
    },
    {
        email: "nathvince",
        password: "byeworld",
        isAdmin: false
    }

];

let items = [{
    "name": "Cosrx Snail Mucin",
    "description": "Korean Essence Skincare",
    "price": "649",
    "isActive": true,
    "createdOn": "09-16-2022"
},
{
    "name": "Deerma-B",
    "description": "Korean Sunscreen",
    "price": "600",
    "isActive": true,
    "createdOn": "02-21-2023"
}];

let orders = [];
let loggedUser;

// Registration
app.post('/users', (req,res) =>{

    console.log(req.body)
    let newUser = {
        email: req.body.email,  
        password: req.body.password,
        isAdmin: req.body.isAdmin

    }
    
const sameUser = users.find(user => user.email === req.body.email);
if (sameUser) {
    res.status(400).send(' Email already exists. Try another one');
return;
}
    users.push(newUser);
    console.log(users)

    res.send('Registered Successfully')
})
 
//login
app.post('/users/login', (req,res) =>{
    console.log(req.body);

    let foundUser = users.find((user) => {
        return user.username === req.body.username && user.password === req.body.password
    })
    if(foundUser !== undefined){
        let foundUserIndex = users.findIndex((user) => {
            return user.username === foundUser.username
        });
        foundUser.index = foundUserIndex;
        loggedUser = foundUser
        console.log(loggedUser)

        res.send('Thank you for logging in.')
        
    } else {
        loggedUser = foundUser;
        res.send('Login failed. Wrong credentials')
    }
    
});

const checkLoggedIn = (req, res, next) => {
    if (loggedUser) {
        next();
    } else {
        res.status(401).send('Forbidden. Kindly Log in.');
    }
};

//Set Admin
app.put('/users/admin/:index', checkLoggedIn, (req, res) => {
    console.log(req.params);
    console.log(req.params.index);
    let userIndex = parseInt(req.params.index);
    
    if (loggedUser.isAdmin === true) {
        users[userIndex].isAdmin = true;
        console.log(users[userIndex]);
        res.send('Admin access is granted to User')
    } else {
        res.send('Unathorized. User is not an Admin. Action Forbidden')
    }
});



// add items
app.post('/items', checkLoggedIn, (req,res) =>{
    console.log(loggedUser);
    console.log(req.body);

    if(loggedUser.isAdmin === true) {
        let newItem = {
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            isActive: req.body.isActive,
            createdOn: req.body.createdOn
        }
        items.push(newItem);
        console.log(items)

        res.send('You have added a new item.');
    } else {
        res.send('Unauthorized. Action Forbidden');
    }
});

//retrieve items
app.get('/items',checkLoggedIn, (req,res) => {
    console.log(loggedUser);
    res.send(items);

});

//retrieve active items
app.get('/items/active', checkLoggedIn, (req, res) => {
    const activeItems = items.filter(item => item.isActive === true);
    res.send(activeItems);
});

//retrieve specific item
app.get("/items/:index", checkLoggedIn, (req,res) => {
    console.log(req.params);
    console.log(req.params.index)
    let index = parseInt(req.params.index);
    let item = items[index]
    res.send(item)
});


//archive items 
app.put('/items/archive/:index', checkLoggedIn, (req,res) =>{
    console.log(req.params);
    console.log(req.params.index);
    let itemIndex = parseInt(req.params.index);
    if (loggedUser.isAdmin === true) {
        items[itemIndex].isActive = false;
        console.log(items[itemIndex]);
        res.send('Item Archived.');
    } else {
        res.send('Unauthorized. Action Forbidden');
    }
});


// Update Item Details
app.put('/items/info/:index', (req, res) => {
    if (loggedUser.isAdmin === true) {
        console.log(req.params);
        console.log(req.params.index);
        let itemIndex = parseInt(req.params.index);
            if (itemIndex < 0 || itemIndex >= items.length) {
                res.status(404).send('item not found.');
                return;
        }
        items[itemIndex].description = req.body.description;
        console.log(items[itemIndex]);
        res.send('Item details updated.');
    } else {
        res.send('Unathorized. User is not an Admin. Action Forbidden');
    }
});

// create order
app.post('/order', (req, res) => {
    if (loggedUser.isAdmin === false) {
        console.log(req.body);

        const chosenProduct = req.body.products;
        const sameItem = items.find(item => item.name.toLowerCase().includes(chosenProduct.toLowerCase()));
        
        if (!sameItem) {
            res.status(400).send('Invalid product.');
            return;
        }

        if (!sameItem.isActive) {
            res.status(400).send('Product is Inactive. Adding Inactive product cannot be done.');
            return;
        }

        let newOrder = {
            userId: loggedUser.username,
            products: [sameItem],
            price: sameItem.price,
            quantity: req.body.quantity,
            purchasedOn: req.body.purchasedOn || new Date()
        };

        orders.push(newOrder);
        // check if pushed successfully
        console.log(orders);

        res.send('You have created a new order!');
    } else {
        res.send('Unauthorized. User is an Admin. Action Forbidden');
    }
});

// User order Aunthentication
app.get('/order/items', (req, res) => {
    if (loggedUser) {
        const userOrders = orders.filter(order => order.userId === loggedUser.username);
        const userProducts = userOrders.flatMap(order => {
            return order.products.map(product => {
                return {
                    ...product,
                    quantity: order.quantity
                };
            });
        });

        console.log(userProducts);
        res.send(userProducts);
    } else {
        res.send('Unauthorized. User is an Admin. Action Forbidden');
    }
});

// Quantity Update
app.put('/order/update/:index', (req, res) => {
    if (loggedUser) {
        const orderIndex = parseInt(req.params.index);
            if (orderIndex < 0 || orderIndex >= orders.length) {
                res.status(404).send('Order not found.');
                return;
            }
        orders[orderIndex].quantity = req.body.quantity;
        res.send('Item Quantity is updated.');
    } else {
        res.status(401).send('Unauthorized. Kindly log in.');
    }
});

// Remove products
app.delete('/order/remove/:index', (req, res) => {
    if (loggedUser) {
        const orderIndex = parseInt(req.params.index);
        const userOrders = orders.filter(order => order.userId === loggedUser.username);
        if (orderIndex < 0 || orderIndex >= userOrders.length) {
            res.status(404).send('Order not found.');
            return;
        }
        userOrders[orderIndex].products.splice(orderIndex, 1);
        res.send(`Item is removed from the cart.`);
    } else {
        res.status(401).send('Unauthorized. Kindly login.');
    }
});

// Compute subtotal
app.get('/order/subtotal', (req, res) => {
    if (loggedUser) {
        const userOrders = orders.filter(order => order.userId === loggedUser.username);

        const cartItems = userOrders.flatMap(order => {
            return order.products.map(product => {
                const subtotal = product.price * order.quantity;
                return {
                    ...product,
                    subtotal
                };
            });
        });

        res.json(cartItems);
    } else {
        res.status(401).send('Unauthorized. Please log in.');
    }
});

// Compute total price
app.get('/order/total', (req, res) => {
    let total = 0;
    if (loggedUser) {
        const userOrders = orders.filter(order => order.userId === loggedUser.username);
        userOrders.forEach(order => {
            order.products.forEach(product => {
                total += product.price * order.quantity;
            });
        });
    res.send(`Total price for all items in the cart: P${total.toFixed(2)}`);
    } else {
        res.status(401).send('Unauthorized.Kindly login.');
    }
});


// get all orders
app.get('/order/all', (req, res) => {
    console.log(req.body);
    if (loggedUser.isAdmin === true) {
        res.send(orders);
    } else {
        res.send('Unathorized. User is not an Admin. Action Forbidden');
    }
});


app.listen(port, () => console.log(`Server is running at port ${port}`));