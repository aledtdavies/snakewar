export class Input {
    constructor(canvas) {
        this.canvas = canvas;
        this.mouseX = window.innerWidth / 2;
        this.mouseY = window.innerHeight / 2;
        this.isBoosting = false;

        // Binding context so we can remove listeners if needed later
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);

        // Web defaults
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('mousedown', this.handleMouseDown);
        window.addEventListener('mouseup', this.handleMouseUp);

        // Touch events
        window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        window.addEventListener('touchstart', (e) => {
            if (e.target.id !== 'btn-boost-mobile') {
                this.handleTouchMove(e);
            }
        }, { passive: false });

        // Mobile Boost Button (Fixed Position)
        const mobBtn = document.getElementById('btn-boost-mobile');
        if (mobBtn) {
            mobBtn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                mobBtn.setPointerCapture(e.pointerId);
                this.isBoosting = true;
            });
            const handlePointerUp = (e) => {
                e.preventDefault();
                this.isBoosting = false;
                mobBtn.releasePointerCapture(e.pointerId);
            };
            mobBtn.addEventListener('pointerup', handlePointerUp);
            mobBtn.addEventListener('pointercancel', handlePointerUp);
        }
    }

    // Calculate relative angle from center of screen to mouse cursor
    // The snake's head is always fixed at center of screen!
    getAngle() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        return Math.atan2(this.mouseY - centerY, this.mouseX - centerX);
    }

    handleMouseMove(e) {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
    }

    handleTouchMove(e) {
        if (e.touches.length > 0) {
            // Use the first touch point that isn't the boost button
            for (let i = 0; i < e.touches.length; i++) {
                if (e.touches[i].target.id !== 'btn-boost-mobile') {
                    this.mouseX = e.touches[i].clientX;
                    this.mouseY = e.touches[i].clientY;
                    break;
                }
            }
        }
    }

    handleKeyDown(e) {
        if (e.code === 'Space') {
            this.isBoosting = true;
        }
    }

    handleKeyUp(e) {
        if (e.code === 'Space') {
            this.isBoosting = false;
        }
    }

    handleMouseDown(e) {
        // Left click can also trigger boost
        if (e.button === 0) {
            this.isBoosting = true;
        }
    }

    handleMouseUp(e) {
        if (e.button === 0) {
            this.isBoosting = false;
        }
    }

    destroy() {
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('mousedown', this.handleMouseDown);
        window.removeEventListener('mouseup', this.handleMouseUp);
    }
}
