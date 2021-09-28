var h = 650 ,
    w = 1050;

var dset = [0.00001, 0.0001, 0.001, 0.01, 0.1, 0.5, 1];
var rset = [1, 1.5, 2, 4, 10, 20, 30];
color = d3.scaleOrdinal(d3.schemeCategory10);

myprojection = d3.geoEquirectangular() 
 .center([0,0]);

geoGenerator = d3.geoPath()
 .projection(myprojection);

var svg = d3.select("svg")
  .attr("height",h)
  .attr("width",w);

var g = d3.select('svg')
  .append("g");

g.append("rect")
 .attr("class","svg-bg")
 .attr("height",h)
 .attr("width",w);

d3.json("https://d3js.org/world-50m.v1.json",function(error,topology)
{
  //console.log(topology);
  countries = topojson.feature(topology, topology.objects.countries);
  myprojection.fitSize([w,h],countries);
  
  // Join the FeatureCollection's features array to path elements
  g.selectAll('path')
   .data(topojson.feature(topology, topology.objects.countries).features)
   .enter()
   .append("path")
   .attr("class","boundary")
   .attr("d",geoGenerator);

  d3.json("https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/meteorite-strike-data.json",function(data)
  {
    // Valid i.e Non-zero meteorite Data
    meteoriteData = data.features.filter(function(obj){ 
      if( obj.geometry !== null) 
        return obj;
    });
    
    //Convert mass - string val to number val
    meteoriteData.forEach(function(d){
       d.properties.mass = Number(d.properties.mass);
    });

    // Sort by high to low mass value 
    // To make small circles appear on top of large circles
    meteoriteData.sort(function(a,b){
     return b.properties.mass - a.properties.mass;
    });
         
    var minMass = d3.min(meteoriteData,function(d){ 
      return d.properties.mass;
    }) || 1;
    var maxMass = d3.max(meteoriteData,function(d){ 
      return d.properties.mass;
    });
   
    // Scale massValues within 0 to 1
    domain = meteoriteData.map(function(d){ return d.properties.mass/maxMass});
    
    g.selectAll("circle")
      .data(meteoriteData)
      .enter()
      .append("circle")
      .attr("class","circle")
      .attr("fill",function(d,i){return color(i)})
      .attr("r",function(d)
      { 
        massValue = Number(d.properties.mass)/maxMass;              
        bucketIndex = dset.findIndex(function(domainValue,i){ 
           return (domainValue > massValue);
        });
       
         if(bucketIndex === 0 ) bucketIndex = 0;
         else if (bucketIndex === -1) bucketIndex = dset.length-1;
         else bucketindex = bucketIndex-1;

         return rset[bucketIndex]; 
      }) 
      .attr("cx",function(d){ 
        return myprojection(d.geometry.coordinates)[0];
      })
      .attr("cy",function(d){ 
        return myprojection(d.geometry.coordinates)[1];
      })
      .on("mouseover",function(d){  
        var tooltip = d3.select(".tooltip");
        
        tooltip.style("left", (d3.event.pageX - 25)+ "px")
               .style("top", (d3.event.pageY + 25) + "px")
               .transition()
               .duration(200)
               .style("opacity","1");
      
        tooltip.html("<span>Mass : </span>" + d.properties.mass + "<br><span>Name : </span>" + d.properties.name + "<br><span>Latitude : </span>" + d.properties.reclat + "<br><span>Longitude : </span>" +  d.properties.reclong + "<br><span>Year : </span> " + d3.timeFormat("%B %d, %Y")(new Date(d.properties.year)) + "<br>");
      })
      .on("mouseleave",function(){
        d3.select(".tooltip")
          .transition()
          .duration(500)
          .style("opacity","0"); 
      });
      
   g.selectAll("circle")
    .filter(function(d,i){ return d3.select(this).attr("r") <= 4; })
    .classed("circleBorder",true);
    
    // zoom and pan
    var zoom = d3.zoom()
      .on("zoom",function() {
          g.attr("transform",d3.event.transform);
          g.selectAll("circle")
              .attr("d", geoGenerator.projection(myprojection));
          g.selectAll("path")  
              .attr("d", geoGenerator.projection(myprojection));
    });
    svg.call(zoom);       
  });
});