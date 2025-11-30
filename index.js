import kaplay from "https://unpkg.com/kaplay@3001.0.19/dist/kaplay.mjs";
import loadCars from "./car.js";
import loadRoads from "./roads.js";

const size = { width: 1280, height: 720, margin: 0.01 };

const scale = Math.min(
    window.innerWidth * (1 - size.margin * 2) / size.width,
    window.innerHeight * (1 - size.margin * 2) / size.height
);

kaplay({
    width: size.width,
    height: size.height,
    background: "#99e7d3",
    scale: scale,
});


loadRoot("./assets");
const Car = loadCars();
const Roads = loadRoads(['level1.txt', 'level2.txt']);



scene("main", () => {
    Roads.setMap('level1.txt');
    const redCar = new Car("blue", [50, 50]);
    onKeyDown("right", () => {
        redCar.move(200);
    });
    onKeyDown("up", () => {
        redCar.rotate(5);
    });
});

go("main");