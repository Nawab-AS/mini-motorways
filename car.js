export default function loadCars() {
    class car {
        static colors = ["red", "blue", "green"];
        constructor(color, position=pos(0,0)) {
            if (!car.colors.includes(color)) {throw new Error(`Invalid car color: ${color}`)}
            this.object = add([
                position,
                rotate(0),
                scale(0.05),

                anchor("center"),
                sprite(`${color}Car`),
                "car",
                color,
            ]);
            // this.object.onDraw(this.#onDraw);
        }

        move(d) {
            const angleRad = this.object.angle * Math.PI / 180;
            this.object.move(Math.cos(angleRad) * d, Math.sin(angleRad) * d);
        }

        rotate(angle) {this.object.angle += angle; this.object.angle %= 360;}
    }


    // Load car sprites
    for (const color of car.colors) {
        loadSprite(`${color}Car`, `/cars/${color}Car.png`);
    }
    loadSprite("carShadow", "/cars/carShadow.png");

    return car;
}