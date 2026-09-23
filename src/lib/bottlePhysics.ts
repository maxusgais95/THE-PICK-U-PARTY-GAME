/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DragSample {
  angle: number; // in radians
  time: number;  // in milliseconds
}

export class BottlePhysicsController {
  public angle: number = 0; // in degrees [0..360)
  public angularVelocity: number = 0; // in degrees per frame
  public isDragging: boolean = false;
  public isSpinning: boolean = false;
  
  private friction: number = 0.992;
  private minVelocityThreshold: number = 0.035;
  private lastTickAngle: number = 0;
  private tickIntervalDegrees: number = 24;
  
  private dragHistory: DragSample[] = [];
  private lastTouchAngle: number = 0;
  private dragStartTime: number = 0;
  
  public onTick?: (velocity: number) => void;
  public onSettle?: (finalAngle: number) => void;

  constructor(initialAngle: number = 0, friction: number = 0.992) {
    this.angle = initialAngle % 360;
    if (this.angle < 0) this.angle += 360;
    this.lastTickAngle = this.angle;
    this.friction = Math.max(0.988, Math.min(0.995, friction));
  }

  public setFriction(friction: number) {
    this.friction = Math.max(0.988, Math.min(0.995, friction));
  }

  // Calculate angle of point (x, y) relative to center (cx, cy) in radians
  public static getPointAngle(x: number, y: number, cx: number, cy: number): number {
    return Math.atan2(y - cy, x - cx);
  }

  // Start touch drag
  public startDrag(x: number, y: number, cx: number, cy: number) {
    this.isDragging = true;
    this.isSpinning = false;
    this.angularVelocity = 0;
    
    const touchAngleRad = BottlePhysicsController.getPointAngle(x, y, cx, cy);
    this.lastTouchAngle = touchAngleRad;
    this.dragStartTime = performance.now();
    
    this.dragHistory = [{
      angle: touchAngleRad,
      time: this.dragStartTime
    }];
  }

  // Update drag position with smooth continuous angle calculation
  public updateDrag(x: number, y: number, cx: number, cy: number) {
    if (!this.isDragging) return;
    
    const currentTouchAngleRad = BottlePhysicsController.getPointAngle(x, y, cx, cy);
    const now = performance.now();
    
    // Calculate shortest angular delta relative to last touch
    let deltaRad = currentTouchAngleRad - this.lastTouchAngle;
    while (deltaRad > Math.PI) deltaRad -= Math.PI * 2;
    while (deltaRad < -Math.PI) deltaRad += Math.PI * 2;
    
    const deltaDeg = (deltaRad * 180) / Math.PI;
    this.angle = (this.angle + deltaDeg) % 360;
    if (this.angle < 0) this.angle += 360;
    
    this.lastTouchAngle = currentTouchAngleRad;
    
    // Sound tick on rotational milestone
    if (Math.abs(this.angle - this.lastTickAngle) >= this.tickIntervalDegrees) {
      if (this.onTick) this.onTick(2.5);
      this.lastTickAngle = this.angle;
    }
    
    // Keep recent history (last 120ms)
    this.dragHistory.push({ angle: currentTouchAngleRad, time: now });
    while (this.dragHistory.length > 2 && now - this.dragHistory[0].time > 120) {
      this.dragHistory.shift();
    }
  }

  // Release drag with computed angular flick velocity
  public endDrag(): number {
    if (!this.isDragging) return 0;
    this.isDragging = false;
    
    const now = performance.now();
    let flickVelocity = 0;
    
    if (this.dragHistory.length >= 2) {
      const oldest = this.dragHistory[0];
      const newest = this.dragHistory[this.dragHistory.length - 1];
      const dt = (newest.time - oldest.time) / 1000; // in seconds
      
      // If movement occurred recently
      if (dt > 0.015 && dt < 0.3 && (now - newest.time) < 180) {
        let dRad = newest.angle - oldest.angle;
        while (dRad > Math.PI) dRad -= Math.PI * 2;
        while (dRad < -Math.PI) dRad += Math.PI * 2;
        
        const radPerSec = dRad / dt;
        // Convert rad/sec to deg/frame (60fps equivalent)
        flickVelocity = (radPerSec * 180 / Math.PI) / 60;
      }
    }
    
    // Requirement: "Please make bottle spin more longer. Short flink should not be available."
    // Any flick, drag release, or tap guarantees a high-momentum long dramatic spin. Short flicks are disabled.
    const dir = Math.sign(flickVelocity) !== 0 ? Math.sign(flickVelocity) : (Math.random() > 0.5 ? 1 : -1);
    
    // High minimum speed floor guarantees 8-15+ full rotations with slow cinematic deceleration
    const minSpeed = 28 + Math.random() * 6; // 28 - 34 deg/frame minimum
    const maxSpeed = 48;
    
    const userSpeed = Math.abs(flickVelocity) * 1.6;
    const finalSpeed = Math.min(maxSpeed, Math.max(minSpeed, userSpeed));
    
    this.angularVelocity = dir * finalSpeed;
    this.isSpinning = true;
    return this.angularVelocity;
  }

  // Trigger programmed natural spin (for taps or quick play)
  public triggerRandomSpin(minRotations: number = 8, maxRotations: number = 14) {
    const direction = Math.random() > 0.5 ? 1 : -1;
    const baseSpeed = 28 + Math.random() * 12;
    this.angularVelocity = direction * baseSpeed;
    this.isSpinning = true;
    this.isDragging = false;
  }

  // Step physics simulation frame
  public updatePhysics(): boolean {
    if (!this.isSpinning) return false;
    
    this.angle = (this.angle + this.angularVelocity) % 360;
    if (this.angle < 0) this.angle += 360;
    
    // Smooth deceleration curve: exponential decay with micro linear deceleration at very low speeds
    this.angularVelocity *= this.friction;
    if (Math.abs(this.angularVelocity) < 1.0) {
      const sign = Math.sign(this.angularVelocity);
      this.angularVelocity = sign * Math.max(0, Math.abs(this.angularVelocity) - 0.008);
    }
    
    // Tick sound check
    if (Math.abs(this.angle - this.lastTickAngle) >= this.tickIntervalDegrees) {
      if (this.onTick) this.onTick(Math.abs(this.angularVelocity));
      this.lastTickAngle = this.angle;
    }
    
    // Check if settled
    if (Math.abs(this.angularVelocity) < this.minVelocityThreshold) {
      this.angularVelocity = 0;
      this.isSpinning = false;
      if (this.onSettle) {
        this.onSettle(this.getNormalizedAngle());
      }
      return false;
    }
    
    return true;
  }

  public getNormalizedAngle(): number {
    let a = this.angle % 360;
    if (a < 0) a += 360;
    return Math.round(a * 10) / 10;
  }
}

