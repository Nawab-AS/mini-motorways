import kaplay from "./kaplay.mjs";
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
const Roads = loadRoads();


let numCars = 10;
scene("main", async () => {
    Roads.drawMap();
    for (let i = 0; i < 4; i++) {
        console.log(Roads.addRoad(5 + i, 5));
    }
    Roads.addHouse(7, 4, 'right', 'blue');
    Roads.addStore(10, 7, 'up', 'red');
    let cars = [];
    for (let i = 0; i < numCars; i++) {
        cars.push(new Car(Car.colors[i % Car.colors.length], [50 + 25 * i, 50]));
    }

    onKeyDown("right", () => {
        cars.forEach(car => {
            car.move(200);
        });
    });
    onKeyDown("up", () => {
        cars.forEach(car => {
            car.rotate(5);
        });
    });
});

go("main");