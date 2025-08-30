import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common'; // << هنا
import { AppService } from '../../core/services/App.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AppEvent } from '../../core/interfaces/event';

@Component({
  selector: 'app-update',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule], // << ضفنا CommonModule
  templateUrl: './update.component.html',
  styleUrls: ['./update.component.scss'],
})
export class UpdateComponent {
  id: string = '';
  formData!: AppEvent;
  formUpdate!: FormGroup;

  constructor(
    private _fb: FormBuilder,
    private _AppService: AppService,
    private _ActivatedRoute: ActivatedRoute,
    private _Router: Router
  ) {}

  ngOnInit(): void {
    this.id = this._ActivatedRoute.snapshot.params['id'];

    this._AppService.geteventById(this.id).subscribe({
      next: (data) => {
        this.formData = data;
        this.initForm();
      },
      error: (err) => console.error('Get Event Error:', err),
    });
  }

  initForm() {
    this.formUpdate = this._fb.group({
      title: [
        this.formData.title || '',
        [Validators.required, Validators.minLength(3)],
      ],
      date: [this.formData.startDate || '', Validators.required],
      time: [this.formData.time || '', Validators.required],
    });
  }

  onSubmit() {
    if (this.formUpdate.invalid) {
      this.formUpdate.markAllAsTouched();
      return;
    }

    const event: Partial<AppEvent> = this.formUpdate.value;

    this._AppService.updateEvent(event, this.id).subscribe({
      next: (data) => {
        this._Router.navigate(['/events']), console.log('Event updated', data);
      },
        
      error: (err) => console.error('Update Event Error:', err),
    });
  }
}
