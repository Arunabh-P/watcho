document.getElementById('#category').addEventListener('change', (event) => {


    var cat = document.getElementById('#category').selectedOptions[0].value;

    $.ajax({
        url:'/admin/get-subcategory',
        method:'post',
        data:{
            category:cat
        },
        success:(response)=>{

           
            document.getElementById("#subCategory").innerHTML = "";
            response.forEach(element => {
                // output.push('<option value="'+ element +'">'+ element +'</option>');

                var selectElem = document.getElementById('#subCategory');
                
                
                selectElem.options[selectElem.options.length] = new Option(element, '0');

            });
        }
    })
});