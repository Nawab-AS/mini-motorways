export default function loadCars() {
    class car {
        static colors = ["red", "blue", "green"];
        shadowDistance = 5;
        scale = 0.05;
        constructor(color, position=[0,0]) {
            if (!car.colors.includes(color)) {throw new Error(`Invalid car color: ${color}`)}
            this.shadow = add([
                pos(position[0] + this.shadowDistance, position[1] + this.shadowDistance),
                rotate(0),
                scale(this.scale),

                anchor("center"),
                sprite("carShadow"),
            ]);

            this.object = add([
                pos(position[0], position[1]),
                rotate(0),
                scale(this.scale),

                anchor("center"),
                sprite(`${color}Car`),
                "car",
                color,
            ]);
        }

        move(d) {
            const angleRad = this.object.angle * Math.PI / 180;
            this.object.move(Math.cos(angleRad) * d, Math.sin(angleRad) * d);
            this.shadow.pos = this.object.pos.add(this.shadowDistance, this.shadowDistance);
        }

        rotate(angle) {
            this.object.angle += angle;
            this.object.angle %= 360;
            this.shadow.angle = this.object.angle;
        }
    }


    // Load car sprites
    for (const color of car.colors) {
        loadSprite(`${color}Car`, `/cars/${color}Car.png`);
    }
    loadSprite("carShadow", "/cars/carShadow.png");

    return car;
}