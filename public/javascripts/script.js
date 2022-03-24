window.addEventListener('DOMContentLoaded', event => {

    // Toggle the side navigation
    const sidebarToggle = document.body.querySelector('#sidebarToggle');
    if (sidebarToggle) {
        // Uncomment Below to persist sidebar toggle between refreshes
        // if (localStorage.getItem('sb|sidebar-toggle') === 'true') {
        //     document.body.classList.toggle('sb-sidenav-toggled');
        // }
        sidebarToggle.addEventListener('click', event => {
            event.preventDefault();
            document.body.classList.toggle('sb-sidenav-toggled');
            localStorage.setItem('sb|sidebar-toggle', document.body.classList.contains('sb-sidenav-toggled'));
        });
    }
});

//add to cart
function addToCart(proId) {
    $.ajax({
        url: '/add-to-cart/' + proId,
        method: 'get',
        success: (response) => {
            if (response.status) {
                let count = $('#cart-count').html()
                count = parseInt(count) + 1
                $('#cart-count').html(count)
            }

        }
    })
}

//add to wishlist
// function addToWishlist(proId) {
//     $.ajax({
//         url: '/add-to-wishlist/' + proId,
//         method: 'get',
//         success: (response) => {
//             if (response.status) {
//                 let count = $('#wishlist-count').html()
//                 count = parseInt(count) + 1
//                 $('#wishlist-count').html(count)
//             }

//         }
//     })
// }


function addToWishlist(proId) {
    $.ajax({
        url: '/add-to-wishlist/' + proId,
        method: 'get',
        success: (response) => {
            if (response.status==true) {
                let count = $('#wishlist-count').html()
                count = parseInt(count) + 1
                $('#wishlist-count').html(count)
            }else{
                
                swal("hey amigo, Product already in wishlist!");

            }

        }
    })
}




//checkout form




//search
function search_product() {
    let input = document.getElementById('searchbar').value
    input = input.toLowerCase();
    let x = document.getElementsByClassName('brand');
    let d = document.getElementsByClassName('hide-div')
    for (i = 0; i < x.length; i++) {
        if (!x[i].innerHTML.toLowerCase().includes(input)) {
            x[i].style.display = "none";
            d[i].style.display = "none";
        }
        else {
            x[i].style.display = "list-item";
            d[i].style.display = "block";
        }
    }
}

//coupon
function applycoupon() {

    let code = document.getElementById('couponid').value
    // console.log(code)
    $.ajax({
        url: '/place-order/applycoupon',
        data: { code },
        method: 'post',
        success: (response) => {
            console.log(response);
            if (response.couponPrice) {
                newcoupon = code
                // location.reload()
                document.getElementById('couponul').innerHTML += ` <li><span>Discount Price</span><span id=""> ₹ ${response.couponPrice}</span>`
                document.getElementById('applybtn').disabled = true
                // alert(response.disPrice)
                document.getElementById('couponsuccess').innerHTML = response.message
                document.getElementById('couponinvalid').innerHTML = " "

            } else if (response.vmessage == true) {
                document.getElementById('couponinvalid').innerHTML = " "
                document.getElementById('couponinval').innerHTML = response.message

            } else if (response.imessage == true) {
                document.getElementById('couponinval').innerHTML = " "
                document.getElementById('couponinvalid').innerHTML = response.invalidmessage

            } else if (response.umessage == true) {
                console.log("kerii");
                document.getElementById('couponinvalid').innerHTML = response.uerrmessage
            }

        }
    })
}


var demoTrigger = document.querySelector('.demo-trigger');
var paneContainer = document.querySelector('.detail');

new Drift(demoTrigger, {
  paneContainer: paneContainer,
  inlinePane: false,
});







