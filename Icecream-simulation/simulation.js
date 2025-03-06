let arrivalRate, serviceRate, serviceTimeMin, serviceTimeMax, numberOfEvents, meanArrival, varianceArrival, meanService, varianceService;

function exponentialDistribution(serviceRate) {
  return -(serviceRate)*(Math.log(1 - Math.random()));
}

function poissonDistribution(arrivalRate) {
  const L = Math.exp(-arrivalRate);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

function expDistribution(lambda) {
  return -(Math.log(1 - Math.random()) / (1/lambda));
}

function uniformDistribution(min, max) {
  return Math.random() * (max - min) + min;
}

function normalDistribution(mean, stddev) {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const standardNormal = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + stddev * standardNormal;
}

function gammaDistribution(mean, variance) {
  const shape = mean ** 2 / variance;
  const scale = variance / mean;
  let sum = 0;

  for (let i = 0; i < shape; i++) {
    sum += -Math.log(Math.random());
  }

  return sum * scale;
}

function inputFunction(dist){
  if(dist == 'MM1' || dist == 'MM2'){
    arrivalRate = Number(document.getElementById('lambdas').value);
    serviceRate = Number(document.getElementById('mews').value);
  }
  else if(dist == 'MG1' || dist == 'MG2'){
    arrivalRate = Number(document.getElementById('lambdas').value);
    serviceTimeMin = Number(document.getElementById('mins').value)
    serviceTimeMax = Number(document.getElementById('maxs').value) 
  }
  else{
    meanArrival = Number(document.getElementById('mean-1s').value)
    meanService = Number(document.getElementById('mean-2s').value)
    varianceArrival = Number(document.getElementById('variance-1s').value)
    varianceService = Number(document.getElementById('variance-2s').value) 
  }
  numberOfEvents = Number(document.getElementById('random-no').value)
}

function simulateSingleServerQueue(dist){
  inputFunction(dist)

  let arrivalTime = 0;
  let startTime = 0;
  let endTime = 0;
  let serviceTime = 0;
  let turnAroundTime = 0;
  let waitTime = 0;
  let responseTime = 0;
  let serverUtilization = 0;
  let totalIntervalTime = 0;
  let totalServiceTime = 0;

  for (let i = 0; i < numberOfEvents; i++) {
    let interArrivalTime,service;
    if(dist == 'MM1'){
      interArrivalTime = poissonDistribution(arrivalRate)
      service = exponentialDistribution(serviceRate);
    }
    else if(dist == 'MG1'){
      interArrivalTime = expDistribution(arrivalRate)
      service = uniformDistribution(serviceTimeMin, serviceTimeMax);
    }
    else{
      interArrivalTime = gammaDistribution(meanArrival, varianceArrival);
      service = normalDistribution(meanService, Math.sqrt(varianceService))
    }
    (service < 0 || Math.round(service) == 0) ? service = 0 : service;
    const arrival = Math.round(arrivalTime + interArrivalTime)
    arrivalTime = arrival;
    serviceTime = Math.round(service);
    totalIntervalTime +=  interArrivalTime;
    totalServiceTime += serviceTime
    
    startTime = Math.round(Math.max(arrival, endTime));
    endTime = Math.round(startTime + service);

    turnAroundTime = endTime - arrival;
    waitTime = turnAroundTime - serviceTime;
    responseTime = Math.round(startTime) - Math.round(arrivalTime);

    let tableRow = document.createElement('tr');
    tableRow.innerHTML = `
        <td class="font-semibold border text-center px-2 py-3">${arrival}</td>
        <td class="font-semibold border text-center px-2 py-3">${startTime}</td>
        <td class="font-semibold border text-center px-2 py-3">${endTime}</td>
        <td class="font-semibold border text-center px-2 py-3">${serviceTime}</td>
        <td class="font-semibold border text-center px-2 py-3">${turnAroundTime}</td>
        <td class="font-semibold border text-center px-2 py-3">${waitTime}</td>
        <td class="font-semibold border text-center px-2 py-3">${responseTime}</td>
    `;
 
  // Append the table row to the table body
  document.querySelector('.t-body-1').appendChild(tableRow)
  }
  
  serverUtilization = ((numberOfEvents-1)/totalIntervalTime)/(numberOfEvents/totalServiceTime);
  document.querySelector('#util').innerHTML += Math.round(serverUtilization.toFixed(2)*100) + "%"
}

function simulateMultiServerQueue(dist) {
  inputFunction(dist)

  let arrivalTime = 0;
  let startTime = 0;
  let endTime = 0;
  let turnaroundTime = 0;
  let waitTime = 0;
  let responseTime = 0;
  let serverUtilization = 0;
  let server1Utilization = 0
  let server2Utilization = 0
  let totalServiceTime = 0

   // Initialize variables for the two servers
   let server1EndTime = 0;
   let server2EndTime = 0;
   let server1StartTime = 0;
   let server2StartTime = 0;
   let server = ''
  
  for (let i = 0; i < numberOfEvents; i++) {
    let interArrivalTime,serviceTime;
    if(dist == 'MM2'){
      interArrivalTime = poissonDistribution(arrivalRate)
      serviceTime = exponentialDistribution(serviceRate);
    }
    else if(dist == 'MG2'){
      interArrivalTime = expDistribution(arrivalRate)
      serviceTime = uniformDistribution(serviceTimeMin, serviceTimeMax);
    }
    else{
      interArrivalTime = gammaDistribution(meanArrival, varianceArrival);
      serviceTime = normalDistribution(meanService, Math.sqrt(varianceService))
      serviceTime < 0 ? serviceTime = 0 : serviceTime;
    }
    const arrival = arrivalTime + interArrivalTime;
    totalServiceTime += serviceTime
    arrivalTime = Math.round(arrival);
    
    if(server1EndTime <= arrivalTime){
      startTime = arrivalTime
      server1StartTime = arrivalTime
      server1EndTime = arrivalTime + serviceTime
      endTime = server1EndTime
      turnaroundTime = server1EndTime - server1StartTime;
      waitTime = server1StartTime - arrivalTime;
      server = 'S1'
    }
    else if(server2EndTime <= arrivalTime){
      server2StartTime = arrivalTime
      startTime = arrivalTime
      server2EndTime =  arrivalTime + serviceTime
      endTime = server2EndTime
      turnaroundTime = server2EndTime - arrivalTime;
      waitTime = server2StartTime - arrivalTime;
      server = 'S2'
    }
    else if(arrivalTime < server1EndTime && arrivalTime < server2EndTime){
      if(server1EndTime <= server2EndTime){
        server1StartTime =  server1EndTime
        startTime = server1StartTime
        server1EndTime = server1EndTime + serviceTime
        endTime = server1EndTime
        turnaroundTime = server1EndTime - server1StartTime;
        waitTime = server1StartTime - arrivalTime;
        server = 'S1'
      }
      else{
        server2StartTime = server2EndTime
        startTime = server2StartTime
        server2EndTime =  server2EndTime + serviceTime
        endTime = server2EndTime
        turnaroundTime = server2EndTime - server2StartTime;
        waitTime = server2StartTime - arrivalTime;
        server = 'S2'
      }
    }
    responseTime = startTime - arrivalTime;
    server == 'S1' ? server1Utilization += endTime - startTime : server2Utilization += endTime - startTime
    
    let tableRow = document.createElement('tr');
    tableRow.innerHTML = `
        <td class="font-semibold border text-center px-2 py-3">${Math.round(arrivalTime)}</td>
        <td class="font-semibold border text-center px-2 py-3">${Math.round(startTime)}</td>
        <td class="font-semibold border text-center px-2 py-3">${Math.round(endTime)}</td>
        <td class="font-semibold border text-center px-2 py-3">${server}</td>
        <td class="font-semibold border text-center px-2 py-3">${Math.round(serviceTime)}</td>
        <td class="font-semibold border text-center px-2 py-3">${Math.round(turnaroundTime)}</td>
        <td class="font-semibold border text-center px-2 py-3">${Math.round(waitTime)}</td>
        <td class="font-semibold border text-center px-2 py-3">${Math.round(responseTime)}</td>
    `;

  // Append the table row to the table body
  document.querySelector('.t-body-2').appendChild(tableRow)
  }
  
  // serverUtilization = ((server1Utilization + server2Utilization)/totalServiceTime)*100;
  // console.log(serverUtilization)
  document.querySelector('#util').innerHTML += "Server1 " +  Math.round((server1Utilization/totalServiceTime)*100).toFixed(0) + "%" + " / " + "Server2 " + Math.round((server2Utilization/totalServiceTime)*100).toFixed(0) + "%"
}

let selectedModel = 'mm1s'

document.getElementById("mm1s").addEventListener('click', () => {
  implementMM()
  document.querySelector('#table-1').style.display = 'block'
  document.querySelector('#table-2').style.display = 'none'
  selectedModel = 'mm1s'
  document.getElementById("mm1s").style.borderBottom = 'thin solid black'
  deleteForms()
  document.querySelector('.t-body-1').innerHTML = ''
  document.querySelector('.t-body-2').innerHTML = ''
})

document.getElementById('mm2s').addEventListener('click', () => {
  implementMM()
  document.querySelector('#table-1').style.display = 'none'
  document.querySelector('#table-2').style.display = 'block'
  selectedModel = 'mm2s'
  document.getElementById('mm2s').style.borderBottom = 'thin solid black'
  deleteForms()
  document.querySelector('.t-body-1').innerHTML = ''
  document.querySelector('.t-body-2').innerHTML = ''
})

document.getElementById('mg1s').addEventListener('click', () => {
  implementMG()
  document.querySelector('#table-1').style.display = 'block'
  document.querySelector('#table-2').style.display = 'none'
  selectedModel = 'mg1s'
  document.getElementById("mg1s").style.borderBottom = 'thin solid black'
  deleteForms()
  document.querySelector('.t-body-1').innerHTML = ''
  document.querySelector('.t-body-2').innerHTML = ''
})

document.getElementById('mg2s').addEventListener('click', () => {
  implementMG()
  document.querySelector('#table-1').style.display = 'none'
  document.querySelector('#table-2').style.display = 'block'
  selectedModel = 'mg2s'
  document.getElementById("mg2s").style.borderBottom = 'thin solid black'
  deleteForms()
  document.querySelector('.t-body-1').innerHTML = ''
  document.querySelector('.t-body-2').innerHTML = ''
})


document.getElementById('gg1s').addEventListener('click', () => {
  implementGG()
  document.querySelector('#table-1').style.display = 'block'
  document.querySelector('#table-2').style.display = 'none'
  selectedModel = 'gg1s'
  document.getElementById("gg1s").style.borderBottom = 'thin solid black'
  deleteForms()
  document.querySelector('.t-body-1').innerHTML = ''
  document.querySelector('.t-body-2').innerHTML = ''
})

document.getElementById('gg2s').addEventListener('click', () => {
  implementGG()
  document.querySelector('#table-1').style.display = 'none'
  document.querySelector('#table-2').style.display = 'block'
  selectedModel = 'gg2s'
  document.getElementById("gg2s").style.borderBottom = 'thin solid black'
  deleteForms()
  document.querySelector('.t-body-1').innerHTML = ''
  document.querySelector('.t-body-2').innerHTML = ''
})

function implementMM(){
  document.getElementById('lambdas').style.display = 'block'
  document.getElementById('mews').style.display = 'block'
  document.getElementById('maxs').style.display = 'none'
  document.getElementById('mins').style.display = 'none'
  document.getElementById('mean-1s').style.display = 'none'
  document.getElementById('mean-2s').style.display = 'none'
  document.getElementById('variance-1s').style.display = 'none'
  document.getElementById('variance-2s').style.display = 'none'
  document.getElementById(selectedModel).style.borderBottom = 'none'
  document.querySelector('#util').innerHTML = 'Server Utilization: '
  document.getElementById('mm-text').style.display = 'block'
  document.getElementById('mg-text').style.display = 'none'
  document.getElementById('gg-text').style.display = 'none'
}

function implementMG(){
  document.getElementById('lambdas').style.display = 'block'
  document.getElementById('mews').style.display = 'none'
  document.getElementById('maxs').style.display = 'block'
  document.getElementById('mins').style.display = 'block'
  document.getElementById('mean-1s').style.display = 'none'
  document.getElementById('mean-2s').style.display = 'none'
  document.getElementById('variance-1s').style.display = 'none'
  document.getElementById('variance-2s').style.display = 'none'
  document.getElementById(selectedModel).style.borderBottom = 'none'
  document.querySelector('#util').innerHTML = 'Server Utilization: '
  document.getElementById('mm-text').style.display = 'none'
  document.getElementById('mg-text').style.display = 'block'
  document.getElementById('gg-text').style.display = 'none'
}

function implementGG(){
  document.getElementById('mean-1s').style.display = 'block'
  document.getElementById('mean-2s').style.display = 'block'
  document.getElementById('variance-1s').style.display = 'block'
  document.getElementById('variance-2s').style.display = 'block'
  document.getElementById('mews').style.display = 'none'
  document.getElementById('maxs').style.display = 'none'
  document.getElementById('mins').style.display = 'none'
  document.getElementById('lambdas').style.display = 'none'
  document.getElementById(selectedModel).style.borderBottom = 'none'
  document.querySelector('#util').innerHTML = 'Server Utilization: '
  document.getElementById('mm-text').style.display = 'none'
  document.getElementById('mg-text').style.display = 'none'
  document.getElementById('gg-text').style.display = 'block'
}

function deleteForms(){
  document.getElementById('lambdas').value = ''
  document.getElementById('mews').value = ''
  document.getElementById('maxs').value = ''
  document.getElementById('mins').value = ''
  document.getElementById('mean-1s').value = ''
  document.getElementById('mean-2s').value = ''
  document.getElementById('variance-1s').value = ''
  document.getElementById('variance-2s').value = ''
  document.getElementById('random-no').value = ''
}

document.getElementById('mm1s').click()

document.getElementById('calculates').addEventListener('click', () => {
  document.querySelector('#util').innerHTML = 'Server Utilization: '
  document.querySelector('.t-body-1').innerHTML = ''
  document.querySelector('.t-body-2').innerHTML = ''
    switch (selectedModel) {
        case 'mm1s':
          simulateSingleServerQueue('MM1');
          break;
        case 'mm2s':
          simulateMultiServerQueue('MM2');
          break;
        case 'mg1s':
          simulateSingleServerQueue('MG1');
          break;
        case 'mg2s':
          simulateMultiServerQueue('MG2');
        case 'gg1s':
          simulateSingleServerQueue('GG1');
          break;
        case 'gg2s':
          simulateMultiServerQueue('GG2');
          break;
        default:
          break;
      }
})