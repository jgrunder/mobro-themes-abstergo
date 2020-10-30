const settings = {
  min: 0,
  orange: 65,
  red: 80,
  max: 100
};
(function () {
  var hidden, visibilityChange;

  if (typeof document.hidden !== "undefined") {
    // Opera 12.10 and Firefox 18 and later support
    hidden = "hidden";
    visibilityChange = "visibilitychange";
  } else if (typeof document.msHidden !== "undefined") {
    hidden = "msHidden";
    visibilityChange = "msvisibilitychange";
  } else if (typeof document.webkitHidden !== "undefined") {
    hidden = "webkitHidden";
    visibilityChange = "webkitvisibilitychange";
  }

  function handleVisibilityChange() {
    if (!document[hidden]) {
      window.dispatchEvent(new Event('resize'));

      if (charts && Object.keys(charts).length) {
        for (let [key] of Object.entries(charts)) {
          if (charts[key]) {
            charts[key].update();
          }
        }
      }
    }
  }

  document.addEventListener(visibilityChange, handleVisibilityChange, false);
  configureChartJS();
  let charts = {};
  MobroSDK.init().then(() => {
    const mobro_settings = MobroSDK.helper.settings; //could do that better some max vals could be wrong - please fix

    settings.min = mobro_settings.hardware.temperature[0].max;
    settings.red = mobro_settings.hardware.temperature[0].critical;
    settings.orange = mobro_settings.hardware.temperature[0].warning;
    charts = initCharts();
    MobroSDK.addChannelListener('general_processor_temperature', data => {
      charts.cpuTemp.chart.data.datasets[0].data[0] = parseFloat(data.payload.value);
      charts.cpuTemp.chart.data.datasets[0].data[1] = parseFloat(data.payload.value - settings.max);
      charts.cpuTemp.chart.update();
    });
    const cpuLoad = $('#cpu-current-load');
    MobroSDK.addChannelListener('general_processor_usage', data => {
      charts.cpuLoad.chart.data.datasets[0].data.push(parseInt(data.payload.value));
      charts.cpuLoad.chart.data.datasets[0].data.shift();
      cpuLoad.html(parseInt(data.payload.value));
      charts.cpuLoad.chart.data.datasets[0].borderColor = getLineColor(parseInt(data.payload.value));
      charts.cpuLoad.chart.update();
    });
    MobroSDK.addChannelListener('general_graphics_temperature', data => {
      charts.gpuTemp.chart.data.datasets[0].data[0] = parseFloat(data.payload.value);
      charts.gpuTemp.chart.data.datasets[0].data[1] = parseFloat(data.payload.value - settings.max);
      charts.gpuTemp.chart.update();
    });
    const gpuLoad = $('#gpu-current-load');
    MobroSDK.addChannelListener('general_graphics_usage', data => {
      charts.gpuLoad.chart.data.datasets[0].data.push(parseInt(data.payload.value));
      charts.gpuLoad.chart.data.datasets[0].data.shift();
      gpuLoad.html(parseInt(data.payload.value));
      charts.gpuLoad.chart.data.datasets[0].borderColor = getLineColor(parseInt(data.payload.value));
      charts.gpuLoad.chart.update();
    });
    MobroSDK.addChannelListener('general_memory_usage', data => {
      charts.ramUsage.chart.data.datasets[0].data[0] = parseFloat(data.payload.value);
      charts.ramUsage.chart.data.datasets[0].data[1] = parseFloat(100 - data.payload.value);
      charts.ramUsage.chart.update();
    });
    const memoryData = $('#mobro-ram-data--used');
    MobroSDK.addChannelListener('general_memory_used', data => {
      memoryData.html(convert(data.payload.unit,'GB',data.payload.value).toFixed(2));
    });
    MobroSDK.emit("monitor:hardware").then(data => {
      $("#mobro-ram-data--total").html(convert(data.memory.capacityunit,'GB',data.memory.totalcapacity) + 'GB');
    });
    MobroSDK.emit("monitor:sensor:data", "general_processor_temperature").then(data => {//could prefill line graphs later on...
    });
    MobroSDK.emit("monitor:sensor:data", "theme_vram_total").then(data => {
      if (!data.value || !data.unit) {
        return;
      }

      $("#mobro-vram-data-total").html(convert(data.unit,'GB',data.value) + 'GB');
    });
    // Convert Hexa color into css filter:
    // https://codepen.io/sosuke/pen/Pjoqqp
    MobroSDK.addChannelListener("theme_fan_speed_cpu", data => {
      if (data.payload && data.payload.sensortype) {
        var currentPercent = parseFloat(data.payload.value);
        $("#cpu_fan_usage").html(currentPercent + "%");
        if(currentPercent <= 50) {
          $("#cpu_fan_img").css('filter', "invert(44%) sepia(92%) saturate(468%) hue-rotate(150deg) brightness(93%) contrast(96%)");
        }
        else if(currentPercent <= 70) {
          $("#cpu_fan_img").css('filter', "invert(50%) sepia(86%) saturate(1036%) hue-rotate(360deg) brightness(103%) contrast(106%)");
        }
        else {
          $("#cpu_fan_img").css('filter', "invert(9%) sepia(78%) saturate(6113%) hue-rotate(18deg) brightness(87%) contrast(122%)");
        }
      } else {
        $("#cpu_fan_usage").html("0%");
        $("#cpu_fan_img").css('filter', "invert(0%) sepia(91%) saturate(7500%) hue-rotate(317deg) brightness(97%) contrast(103%)");
      }
    });
    MobroSDK.addChannelListener("theme_fan_speed_gpu", data => {
      if (data.payload) {
        $("#gpu_rpm").html(parseFloat(data.payload.value) + " RPM");
      } else {
        $("#gpu_rpm").html("0 RPM");
      }
    });
    MobroSDK.addChannelListener("theme_fan_usage_gpu", data => {
      if (data.payload) {
        var currentPercent = parseFloat(data.payload.value);
        $("#gpu_fan_usage").html(currentPercent + "%");
        if(currentPercent <= 50) {
          $("#gpu_fan_img").css('filter', "invert(44%) sepia(92%) saturate(468%) hue-rotate(150deg) brightness(93%) contrast(96%)");
        }
        else if(currentPercent <= 70) {
          $("#gpu_fan_img").css('filter', "invert(50%) sepia(86%) saturate(1036%) hue-rotate(360deg) brightness(103%) contrast(106%)");
        }
        else {
          $("#gpu_fan_img").css('filter', "invert(9%) sepia(78%) saturate(6113%) hue-rotate(18deg) brightness(87%) contrast(122%)");
        }
      } else {
        $("#gpu_fan_usage").html("0%");
        $("#gpu_fan_img").css('filter', "invert(0%) sepia(91%) saturate(7500%) hue-rotate(317deg) brightness(97%) contrast(103%)");
      }
    });
    const vram = $("#vram-chart-doughnut");
    const vramData = $("#mobro-vram-data");
    MobroSDK.addChannelListener("theme_vram", data => {
      if (data.payload) {
        vramData.css('display', 'inline-block');
        vramData.html(convert(data.payload.unit, 'GB', data.payload.value).toFixed(2));
      } else {
        vram.hide();
      }
    });
    MobroSDK.addChannelListener("theme_vram_percentage", data => {
      if (data.payload) {
        if (!charts.vramUsage) {
          charts.vramUsage = createDoughnuts($("#vram-chart-doughnut"));
          vram.show();
        }

        charts.vramUsage.chart.data.datasets[0].data[0] = parseFloat(data.payload.value);
        charts.vramUsage.chart.data.datasets[0].data[1] = parseFloat(100 - data.payload.value);
        charts.vramUsage.chart.update(); // vramData.innerHTML =
      } else {
        vram.hide();
      }
    });
    MobroSDK.addChannelListener("theme_network_dl_usage", data => {
      charts.networkUsage.chart.data.datasets[0].data.push(parseInt(data.payload.value));
      charts.networkUsage.chart.data.datasets[0].data.shift();
      charts.networkUsage.chart.update();
      $("#network-unit").html(data.payload.unit);
    });
    MobroSDK.addChannelListener("theme_network_up_usage", data => {
      charts.networkUsage.chart.data.datasets[1].data.push(parseInt(data.payload.value));
      charts.networkUsage.chart.data.datasets[1].data.shift();
      charts.networkUsage.chart.update();
    });
  });
})();

function convert(from, to, value) {
  switch(from) {
    case 'B':
      switch(to) {
        case 'MB':
          return value / 1024 / 1024;
          break;
        case 'GB':
        default:
          return value / 1024 / 1024 / 1024;
      }
      break;
    case 'MB':
      switch(to) {
        case 'MB':
          return value;
          break;
        case 'GB':
        default:
          return value / 1024;
      }
      break;
    case 'GB':
      switch(to) {
        case 'MB':
          return value * 1024;
          break;
        case 'GB':
        default:
          return value;
      }
      break;
  }
}

function getLineColor(value) {
  if(value < 60) {
    return 'rgba(15, 150, 200, 1)';
  }
  else if (value < 85) {
    return 'rgba(255, 140, 0, 1)';
  }
  else {
    return 'rgba(139, 0, 0, 1)';
  }
}

function initCharts() {
  return {
    "cpuLoad": createLine($("#cpu-chart-line")),
    "cpuTemp": createDoughnuts($("#cpu-chart-doughnut")),
    "gpuLoad": createLine($("#gpu-chart-line")),
    "gpuTemp": createDoughnuts($("#gpu-chart-doughnut")),
    "networkUsage": createLines($("#network-chart-line")),
    "ramUsage": createDoughnuts($("#ram-chart-doughnut")),
    "vramUsage": null
  };
}

function createDoughnuts(element) {
  const outlineDoughnutOptions = {
    responsive: true,
    cutoutPercentage: 75,
    circumference: 1.6 * Math.PI,
    rotation: -(1.3 * Math.PI),
    breakpoints: {
      min: settings.min,
      orange: settings.orange,
      red: settings.red,
      max: settings.max
    }
  };
  return new Chart(element, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [0, 0],
        backgroundColor: ['rgba(0, 255, 30, 1)', 'rgb(80,110,120)'],
        borderWidth: 0
      }]
    },
    options: outlineDoughnutOptions
  });
}

function createClosedDoughnuts(element) {
  const outlineDoughnutOptions = {
    cutoutPercentage: 75
  };
  return new Chart(element, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [2, 1],
        backgroundColor: ['rgba(0, 255, 255, 1)', 'rgb(80,110,120)'],
        borderWidth: 0
      }]
    },
    options: outlineDoughnutOptions
  });
}

function createLine(element, interpolate = false) {
  const animation = {
    duration: 750,
    easing: 'linear'
  };
  const lineOptions = {
    tooltips: {
      enabled: false
    },
    hover: {
      mode: null
    },
    animation: animation,
    cubicInterpolationMode: interpolate,
    responsive: true,
    scales: {
      xAxes: [{
        display: true,
        // mandatory
        scaleLabel: {
          display: false,
          // mandatory
          labelString: 'Your label' // optional

        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 6
        }
      }],
      yAxes: [{
        display: true,
        gridLines: {
          display: false,
          drawBorder: false
        },
        ticks: {
          mirror: true
        }
      }]
    }
  };
  return new Chart(element, {
    type: 'line',
    data: {
      labels: [30,29,28,27,26,25,24,23,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1],
      datasets: [{
        lineTension: 0,
        data: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        borderColor: 'rgba(15, 150, 200, 1)',
        borderWidth: 2,
        pointRadius: '0',
        fill: false
      }]
    },
    options: lineOptions
  });
}

function createLines(element, interpolate = false) {
  const animation = {
    duration: 750,
    easing: 'linear'
  };
  const lineOptions = {
    tooltips: {
      enabled: false
    },
    hover: {
      mode: null
    },
    animation: animation,
    cubicInterpolationMode: interpolate,
    responsive: true,
    scales: {
      xAxes: [{
        display: true,
        // mandatory
        scaleLabel: {
          display: false,
          // mandatory
          labelString: 'Your label' // optional

        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 6
        }
      }],
      yAxes: [{
        display: true,
        gridLines: {
          display: true,
          drawBorder: false
        },
        ticks: {
          mirror: true
        }
      }]
    }
  };
  return new Chart(element, {
    type: 'line',
    data: {
      labels: [30,29,28,27,26,25,24,23,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1],
      datasets: [{
        lineTension: 0,
        data: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        borderColor: 'rgba(15, 150, 200, 1)',
        borderWidth: 2,
        pointRadius: '0',
        fill: false
      },
      {
        lineTension: 0,
        data: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        borderColor: 'rgba(137, 45, 156, 1)',
        borderWidth: 2,
        pointRadius: '0',
        fill: false
      }]
    },
    options: lineOptions
  });
}

function configureChartJS() {
  Chart.defaults.global.legend.display = false;
  Chart.defaults.global.tooltips.enabled = false;
  Chart.defaults.global.hover.mode = null;
  Chart.pluginService.register({
    beforeDraw: function (chart) {
      var width = chart.chart.width,
          height = chart.chart.height,
          ctx = chart.chart.ctx,
          type = chart.config.type;

      if (type == 'line') {
        if(typeof chart.config.data.datasets[1] != 'undefined') {
          var min = Math.min(...chart.config.data.datasets[0].data, ...chart.config.data.datasets[1].data);
          var max = Math.max(...chart.config.data.datasets[0].data, ...chart.config.data.datasets[1].data);
          chart.config.options.scales.yAxes[0].ticks.stepSize = max;
          if($("#network-unit").html() == 'KB/s') {
            if(max < 100) {
              chart.config.options.scales.yAxes[0].ticks.max = 100;
              chart.config.options.scales.yAxes[0].ticks.min = 0;
              chart.config.options.scales.yAxes[0].ticks.stepSize = 100;
            }
            else if(max < 500) {
              chart.config.options.scales.yAxes[0].ticks.max = 500;
              chart.config.options.scales.yAxes[0].ticks.min = min;
              chart.config.options.scales.yAxes[0].ticks.stepSize = 500;
            }
            else if(max < 1000) {
              chart.config.options.scales.yAxes[0].ticks.max = 1000;
              chart.config.options.scales.yAxes[0].ticks.min = min;
              chart.config.options.scales.yAxes[0].ticks.stepSize = 500;
            }
            else {
              chart.config.options.scales.yAxes[0].ticks.max = max;
              chart.config.options.scales.yAxes[0].ticks.min = min;
            }
          }
        }
        else {
          var min = Math.min(...chart.config.data.datasets[0].data);
          var max = Math.max(...chart.config.data.datasets[0].data);
          /*
          if (max - min >= 1) {
            chart.config.options.scales.yAxes[0].ticks.stepSize = max;
            chart.config.options.scales.yAxes[0].ticks.max = max;
            chart.config.options.scales.yAxes[0].ticks.min = min;
          } else {
            chart.config.options.scales.yAxes[0].ticks.stepSize = max + 1;
            chart.config.options.scales.yAxes[0].ticks.max = max + 1;
            chart.config.options.scales.yAxes[0].ticks.min = Math.max(min - 1, 0);
          }
          */
          if(min <= 50 && max <= 50) {
            chart.config.options.scales.yAxes[0].ticks.stepSize = 50;
            chart.config.options.scales.yAxes[0].ticks.max = 50;
            chart.config.options.scales.yAxes[0].ticks.min = 0;
          }
          else if(min > 50 && max > 50) {
            chart.config.options.scales.yAxes[0].ticks.stepSize = 100;
            chart.config.options.scales.yAxes[0].ticks.max = 100;
            chart.config.options.scales.yAxes[0].ticks.min = 50;
          }
          else {
            chart.config.options.scales.yAxes[0].ticks.stepSize = 100;
            chart.config.options.scales.yAxes[0].ticks.max = 100;
            chart.config.options.scales.yAxes[0].ticks.min = 0;
          }
        }
        chart.update();
      }
      if (type == 'doughnut') {
        // var percent = Math.round((chart.config.data.datasets[0].data[0] * 100) /
        //     (chart.config.data.datasets[0].data[0] +
        //         chart.config.data.datasets[0].data[1]));
        let percent = chart.config.data.datasets[0].data[0];
        var oldFill = ctx.fillStyle;
        var fontSize = (height / 4).toFixed(2);
        ctx.restore();
        ctx.textBaseline = "middle";
        var value = percent % 1 ? percent.toFixed(1) : percent;
        let textX = Math.round(width / 2),
            textY = (height + chart.chartArea.top) / 2;
        ctx.font = fontSize / 3 + "px sans-serif";
        ctx.fillStyle = "#FFF";
        ctx.textAlign = "center";
        let text_name = chart.canvas.getAttribute('data-name');
        ctx.fillText(text_name, Math.round(width / 2), textY - height / 5);
        let text_unit = chart.canvas.getAttribute('data-unit');
        ctx.fillText(text_unit, Math.round(width / 2), textY + height / 4);
        ctx.font = fontSize + "px sans-serif";
        ctx.fillStyle = chart.config.data.datasets[0].backgroundColor[0];
        ctx.textAlign = "center";
        ctx.fillText(value, textX, textY + height / 30);
        ctx.fillStyle = oldFill;

        if (chart.canvas.getAttribute('data-border') === 'margins') {
          if (percent < chart.config.options.breakpoints.orange) {
            chart.config.data.datasets[0].backgroundColor[0] = 'rgba(0, 255, 30, 1)';
          }

          if (percent > chart.config.options.breakpoints.orange) {
            chart.config.data.datasets[0].backgroundColor[0] = 'rgba(255, 255, 30, 1)';
          }

          if (percent > chart.config.options.breakpoints.red) {
            chart.config.data.datasets[0].backgroundColor[0] = 'rgba(255, 0, 0, 1)';
          }
        }

        chart.update();
      }
    },
    afterDraw: function (chart) {
      var width = chart.chart.width,
          height = chart.chart.height,
          ctx = chart.chart.ctx,
          type = chart.config.type;

      if (type == 'doughnut' && chart.canvas.getAttribute('data-border') === 'margins') {
        let doughnutlenght = chart.chart.config.options.circumference;
        let lineWidth = chart.radiusLength / 4;
        ctx.lineWidth = lineWidth; //green path

        ctx.strokeStyle = "#00ff1e";
        ctx.beginPath();
        ctx.arc(width / 2, height / 2 + height / 21.05, chart.chart.controller.outerRadius - lineWidth / 2, chart.chart.config.options.rotation, chart.chart.config.options.rotation + chart.chart.config.options.circumference * chart.chart.config.options.breakpoints.orange / 100);
        ctx.stroke(); //yellow path

        ctx.strokeStyle = "#FFFF00";
        ctx.beginPath();
        ctx.arc(width / 2, height / 2 + height / 21.05, chart.chart.controller.outerRadius - lineWidth / 2, chart.chart.config.options.rotation + chart.chart.config.options.circumference * chart.chart.config.options.breakpoints.orange / 100, chart.chart.config.options.circumference * 0.10);
        ctx.stroke(); //red path

        ctx.strokeStyle = "#FF0000";
        ctx.beginPath();
        ctx.arc(width / 2, height / 2 + height / 21.05, chart.chart.controller.outerRadius - lineWidth / 2, chart.chart.config.options.rotation + chart.chart.config.options.circumference * chart.chart.config.options.breakpoints.red / 100, chart.chart.config.options.rotation + chart.chart.config.options.circumference);
        ctx.stroke();
        let spaceWidth = chart.radiusLength / 6;
        ctx.strokeStyle = "#000"; //red

        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2 + height / 21.05, chart.chart.controller.outerRadius - lineWidth / 2 - spaceWidth / 1.5, chart.chart.config.options.rotation, chart.chart.config.options.rotation + chart.chart.config.options.circumference);
        ctx.stroke();
        ctx.save();
      }
    }
  });
}
