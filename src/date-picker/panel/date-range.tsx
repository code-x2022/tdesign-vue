import Vue from 'vue';
import TDateHeader from '../basic/header';
import TDateTable from '../basic/table';
import { DateRangeData, DateRangeMethods, DateRangeComputed, DateRangeProps } from '../type';

import {
  getWeeks,
  getYears,
  getMonths,
  flagActive,
  subtractMonth,
  addMonth,
  isSame,
  getToday,
  firstUpperCase,
  setDateTime,
} from '../utils';

const TODAY = getToday();
const LEFT = 'left';
const RIGHT = 'right';

export default Vue.extend<DateRangeData, DateRangeMethods, DateRangeComputed, DateRangeProps>({
  name: 'TDatePickerDateRange',
  components: {
    TDateHeader,
    TDateTable,
  },
  inheritAttrs: false,
  props: {
    mode: {
      type: String,
      default: 'date',
      validator: (v: string) => ['year', 'month', 'date'].indexOf(v) > -1,
    },
    value: {
      type: Array,
      default: () => [TODAY, TODAY],
    },
    minDate: Date,
    maxDate: Date,
    firstDayOfWeek: Number,
    disabledDate: Function,
    onChange: Function,
  },
  data() {
    return {
      leftYear: null,
      leftMonth: null,
      rightMonth: null,
      rightYear: null,
      leftType: this.mode,
      rightType: this.mode,
      startValue: null,
      endValue: null,
      isFirstClick: true,
      firstClickValue: null,
    };
  },
  computed: {
    leftData() {
      return this.getData({
        year: this.leftYear,
        month: this.leftMonth,
        type: this.leftType,
      });
    },
    rightData() {
      return this.getData({
        year: this.rightYear,
        month: this.rightMonth,
        type: this.rightType,
      });
    },
  },
  watch: {
    value: {
      handler(value) {
        const [startValue = TODAY, endValue = TODAY] = value;
        this.startValue = startValue;
        this.endValue = endValue;
      },
      immediate: true,
    },
    mode(value) {
      this.leftType = value;
      this.rightType = value;
    },
  },
  created() {
    this.initialPicker();
  },
  beforeDestroy() {
    this.initialPicker();
  },
  methods: {
    initialPicker() {
      const data = this.getLeftAndRightDataFromValue(this.value);

      this.leftYear = data.leftYear;
      this.leftMonth = data.leftMonth;
      this.rightYear = data.rightYear;
      this.rightMonth = data.rightMonth;

      this.leftType = this.$props.mode;
      this.rightType = this.$props.mode;
      const [startValue, endValue] = this.$props.value;
      this.startValue = startValue;
      this.endValue = endValue;
      this.isFirstClick = true;
      this.firstClickValue = TODAY;
    },
    getLeftAndRightDataFromValue(value: any) {
      const [startValue = TODAY, endValue = TODAY] = value || this.value;
      const leftYear = startValue.getFullYear();
      const leftMonth = startValue.getMonth();
      let rightMonth = endValue.getMonth();
      let rightYear = endValue.getFullYear();

      if (this.mode === 'date' && isSame(startValue, endValue, 'month')) {
        const next = addMonth(endValue, 1);
        rightMonth = new Date(endValue).getMonth() + 1;
        rightYear = next.getFullYear();
      }

      if (this.mode === 'month' && isSame(startValue, endValue, 'year')) {
        rightYear = leftYear + 1;
      }

      if (this.mode === 'year' && isSame(startValue, endValue, 'year')) {
        rightYear = leftYear + 10;
      }

      return {
        leftYear,
        leftMonth,
        rightMonth,
        rightYear,
      };
    },
    getData({ year, month, type }) {
      const { disabledDate, minDate, maxDate, startValue, endValue } = this;
      const { firstDayOfWeek } = this.$props;
      let data;

      const start = startValue;
      const end = endValue;

      const options = {
        disabledDate,
        minDate,
        maxDate,
        firstDayOfWeek,
      };

      switch (type) {
        case 'date':
          data = getWeeks({ year, month }, options);
          break;
        case 'month':
          data = getMonths(year, options);
          break;
        case 'year':
          data = getYears(year, options);
          break;
        default:
          break;
      }

      return flagActive(data, { start, end, type });
    },
    getClickHandler(direction: string) {
      const type = this[`${direction}Type`];

      return (date: any) => this[`click${firstUpperCase(type)}`](date, direction);
    },
    onHeaderClick(btnType: string, flag: number) {
      this.clickHeader(btnType, flag, LEFT);
      this.clickHeader(btnType, flag, RIGHT);
    },
    clickHeader(btnType: string, flag: number, direction: string) {
      const year = this[`${direction}Year`];
      const month = this[`${direction}Month`];
      const type = this[`${direction}Type`];

      let monthCount; let next;
      switch (type) {
        case 'date':
          monthCount = 1;
          break;
        case 'month':
          monthCount = 12;
          break;
        case 'year':
          monthCount = 120;
      }

      const current = new Date(year, month);

      if (flag === 1) {
        next = addMonth(current, monthCount);
      } else {
        next = subtractMonth(current, monthCount);
      }

      this[`${direction}Year`] = next.getFullYear();
      this[`${direction}Month`] = next.getMonth();
    },
    clickDate(date: Date) {
      if (this.isFirstClick) {
        this.startValue = date;
        this.endValue = date;
        this.isFirstClick = false;
        this.firstClickValue = date;
      } else {
        this.$props.onChange([this.startValue, setDateTime(date, 23, 59, 59)]);
        this.isFirstClick = true;
      }
    },
    clickYear(date: Date, type: string) {
      if (this.mode === 'year') {
        if (this.isFirstClick) {
          this.startValue = date;
          this.isFirstClick = false;
          this.firstClickValue = date;
        } else {
          this.$props.onChange([this.startValue, this.endValue]);
          this.isFirstClick = true;
        }
      } else {
        this[`${type}Type`] = 'month';
        this[`${type}Year`] = date.getFullYear();
      }
    },
    clickMonth(date: Date, type: string) {
      if (this.mode === 'month') {
        if (this.isFirstClick) {
          this.startValue = date;
          this.isFirstClick = false;
          this.firstClickValue = date;
        } else {
          if (this.endValue < this.startValue) {
            this.endValue = this.startValue;
          }
          this.$props.onChange([this.startValue, this.endValue]);
          this.isFirstClick = true;
        }
      } else {
        this[`${type}Type`] = 'date';
        this[`${type}Month`] = date.getMonth();
        this[`${type}Year`] = date.getFullYear();
      }
    },
    onMouseEnter(date: Date) {
      if (this.isFirstClick) {
        return;
      }

      if (this.firstClickValue.getTime() > date.getTime()) {
        this.startValue = date;
        this.endValue = this.firstClickValue;
      } else {
        this.startValue = this.firstClickValue;
        this.endValue = date;
      }
    },
    onTypeChange() {
      this.startValue = this.firstClickValue;
      this.endValue = this.firstClickValue;
    },
    handleTypeChange(direction: string, type: string) {
      this.$data[`${direction}Type`] = type;
    },
  },
  render() {
    const {
      leftType,
      rightType,
    } = this.$data;
    const {
      firstDayOfWeek,
    } = this.$props;
    return (
      <div class="t-date-range">
        <div class="t-date">
          <t-date-header
            year={this.leftYear}
            month={this.leftMonth}
            type={leftType}
            {...{
              props: {
                onBtnClick: (a: string, b: number) => this.onHeaderClick(a, b),
                onTypeChange: (type: string) => this.handleTypeChange(LEFT, type),
              },
            }}
          />

          <t-date-table
            type={leftType}
            first-day-of-week={firstDayOfWeek}
            data={this.leftData}
            {...{
              props: {
                onCellClick: this.getClickHandler(LEFT),
                onCellMouseEnter: this.onMouseEnter,
              },
            }}
          />
        </div>
        <div class="t-date">
          <t-date-header
            year={this.rightYear}
            month={this.rightMonth}
            type={rightType}
            {...{
              props: {
                onBtnClick: (a: string, b: number) => this.onHeaderClick(a, b),
                onTypeChange: (type: string) => this.handleTypeChange(RIGHT, type),
              },
            }}
          />

          <t-date-table
            type={rightType}
            first-day-of-week={firstDayOfWeek}
            data={this.rightData}
            {...{
              on: { 'update:type': this.onTypeChange },
              props: {
                onCellClick: this.getClickHandler(RIGHT),
                onCellMouseEnter: this.onMouseEnter,
              },
            }}
          />
        </div>
      </div>
    );
  },
});