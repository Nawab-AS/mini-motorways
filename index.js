import kaplay from "./kaplay.mjs";
import loadCars from "./car.js";

kaplay({
    width: 200,
    height: 200,
    background: "#18e779",
    scale: 2,
});

loadRoot("./assets");
const Car = loadCars();

scene("main", () => {
    const redCar = new Car("blue", pos(50, 50));
    
    
    onKeyDown("right", () => {
        redCar.move(200);
    });
    onKeyDown("up", () => {
        redCar.rotate(5);
    });
});

go("main");