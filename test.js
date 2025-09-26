// // const { rejects } = require('assert');
// // const fs =require('fs');
// // const fileURLToPath= 'C:/Users/RAHUL/Downloads/prompt (3).txt';
// // fs.readFile(fileURLToPath, 'utf8',(error,data)=>{

// const { resolve } = require("path");

// // if(error)
// // {
// //    console.log('file read error')
// // return;
// // }

// // console.log(data);

// // })



// // function Person(name,age,gender)
// // {

// // this.name=name;
// // this.age=age;
// // this.gender=gender
// // }

// // let result=new Person('rahul tripathi',36,'male')
// // console.log(result)


// // let count=10;

// // (function innerfunction(){

// //    if(count===10)
// //    {
// //       let count=11;
// //    console.log(count)
   
// // }
// // console.log(count,'rahul tripathi')

// // })();


// const resultPromise = new Promise(async (resolve,rejects)=>{
//    setTimeout(()=>{},1)
// }) .then(function (result) {
//     console.log(result); // 1
//     return result * 2;
//   })
//   console.log(await resultPromise)


//   const a = new Promise(async(resolve,rejects)=>{

//    setTimeout(() => {
      
//    }, 1).then((result)=>{
//       return result *2
//    });
//   })


//   async function getData ()
//   {
//    try 
//    {
// const result = await fetch("")
// const data =result.json()
// console.log(data)

//    }
// catch(error){

//    console.log(error)
// }

//   }


   // const   result ='MAMALA'

   // const reverse = result.split('').reverse().join('');
   // console.log(reverse)

   function reverseString(str)
   {

      let reversed='';

      for(let i=str.length-1;i>=0;i--)
      {
         reversed+=str[i]
      }
      return reversed
   }
  console.log( reverseString('DUGGU'))



  function outer ()
  {
var i=1;// this is a closure property 
return function inner()
{

   return i ++;
}

  }
  let run=outer();
  console.log(run ());
  console.log(run());

  const http=require('http')
  const server=http.createServer((req,res)=>{

   res.writeHead(200,{})
  })